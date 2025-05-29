import os
import shutil
import subprocess
import tempfile
import wave
from datetime import datetime
from typing import List

import language_tool_python
import motor.motor_asyncio
import speech_recognition as sr
from fastapi import Depends, FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from routes import exercises  # créer un dossier routes/__init__.py si besoin

app = FastAPI()

# CORS pour dev (à sécuriser en prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connexion MongoDB (local par défaut)
MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
db = client.ortheloquence
sessions_collection = db.sessions

# Dependency to get the database collection
async def get_db():
    return sessions_collection

# Passer la collection sessions_collection au routeur d'exercices
app.include_router(
    exercises.create_router(sessions_collection=sessions_collection),
    prefix="/exercises",
    tags=["exercises"]
)

tool = language_tool_python.LanguageTool('fr')

def convert_to_wav(input_path, output_path):
    # Créer le dossier temporaire s'il n'existe pas
    temp_dir = os.path.dirname(output_path)
    os.makedirs(temp_dir, exist_ok=True)
    
    # Vérifier que le fichier d'entrée existe
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Le fichier d'entrée n'existe pas: {input_path}")
    
    # Vérifier que le fichier d'entrée n'est pas vide
    if os.path.getsize(input_path) == 0:
        raise ValueError("Le fichier audio est vide")
    
    command = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-ar", "44100",  # Sample rate
        "-ac", "1",      # Mono audio
        "-acodec", "pcm_s16le",  # PCM 16-bit
        output_path
    ]
    
    print(f"Exécution de la commande FFmpeg: {' '.join(command)}")
    
    # Exécuter la commande et capturer la sortie
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Vérifier si la commande a échoué
    if result.returncode != 0:
        error_msg = f"Erreur lors de la conversion avec ffmpeg:\nStdout: {result.stdout.decode()}\nStderr: {result.stderr.decode()}"
        print(error_msg)
        raise RuntimeError(error_msg)
    
    # Vérifier que le fichier de sortie existe et n'est pas vide
    if not os.path.exists(output_path):
        raise RuntimeError(f"Le fichier de sortie n'a pas été créé: {output_path}")
    if os.path.getsize(output_path) == 0:
        raise RuntimeError("Le fichier de sortie est vide")
    
    print(f"Conversion réussie: {input_path} -> {output_path}")

TICS = ["euh", "du coup", "ben", "genre", "quoi", "en fait"]

def count_tics(text):
    text_lower = text.lower()
    counts = {}
    for tic in TICS:
        counts[tic] = text_lower.count(tic)
    return counts

@app.post("/transcribe/")
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        shutil.copyfileobj(file.file, tmp)
        input_audio = tmp.name

    output_wav = input_audio.replace(".webm", ".wav")
    convert_to_wav(input_audio, output_wav)

    r = sr.Recognizer()
    try:
        with sr.AudioFile(output_wav) as source:
            audio_data = r.record(source)

        text = r.recognize_google(audio_data, language="fr-FR")
        matches = tool.check(text)
        corrected_text = language_tool_python.utils.correct(text, matches)

        words = corrected_text.split()
        word_count = len(words)

        tic_counts = count_tics(corrected_text)

        with wave.open(output_wav, 'rb') as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            duration_sec = frames / float(rate) if rate > 0 else 0
            speech_rate = (word_count / duration_sec) * 60 if duration_sec > 0 else 0

        return {
            "transcription": text,
            "corrected_transcription": corrected_text,
            "word_count": word_count,
            "speech_rate": round(speech_rate, 1),
            "tic_counts": tic_counts
        }

    except sr.UnknownValueError:
        return {"error": "Speech Recognition n'a pas compris l'audio."}
    except sr.RequestError as e:
        return {"error": f"Erreur API Google Speech: {e}"}
    except Exception as e:
        return {"error": f"Erreur: {e}"}
    finally:
        os.remove(input_audio)
        if os.path.exists(output_wav):
            os.remove(output_wav)

class SessionModel(BaseModel):
    # Champs communs
    type: str # 'transcription' ou 'exercice'
    date: str = datetime.utcnow().isoformat()
    user: str | None = "anonymous" # Ajouter un champ utilisateur

    # Champs spécifiques aux sessions de transcription
    original: str | None = None
    corrected: str | None = None
    wordCount: int | None = None
    speakingTime: float | None = None
    speechRate: float | None = None
    ticCounts: dict | None = None

    # Champs spécifiques aux sessions d'exercices
    exerciseCategory: str | None = None
    exerciseQuestion: str | None = None
    exerciseAnswer: str | None = None # Réponse de l'utilisateur (texte ou transcription orale)
    exerciseScore: int | None = None
    exerciseCorrections: list | None = None # Corrections LanguageTool pour texte, ou autres pour oral
    exerciseTranscriptionData: dict | None = None # Données complètes de transcription pour oral

@app.get("/sessions/", response_model=List[SessionModel])
async def get_sessions():
    sessions = []
    # Permettre de filtrer par type si un paramètre de requête est fourni
    # Exemple: /sessions/?type=exercice
    query = {}
    # if request.query_params.get('type'): # Nécessite d'ajouter Request comme dépendance si on veut utiliser query_params ici
    #    query['type'] = request.query_params['type']
    
    cursor = sessions_collection.find(query).sort("date", -1)
    async for document in cursor:
        # Convertir l'ObjectId en str pour la réponse JSON
        document['_id'] = str(document['_id'])
        sessions.append(document)
    return sessions

@app.post("/sessions/")
async def add_session(session: SessionModel):
    session_dict = session.dict(by_alias=True) # Utiliser by_alias=True si vous utilisez des alias (pas ici)
    # Assurer que le champ _id n'est pas inclus si le frontend envoie accidentellement un
    session_dict.pop("_id", None)
    result = await sessions_collection.insert_one(session_dict)
    # Retourner l'ID inséré pour confirmation
    return {"inserted_id": str(result.inserted_id)}

@app.delete("/sessions/")
async def delete_sessions():
    result = await sessions_collection.delete_many({})
    return {"deleted_count": result.deleted_count}
