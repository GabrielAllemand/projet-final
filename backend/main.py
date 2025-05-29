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
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from routes import exercises  # créer un dossier routes/__init__.py si besoin

app = FastAPI()
app.include_router(exercises.router, prefix="/exercises", tags=["exercises"])

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

tool = language_tool_python.LanguageTool('fr')

def convert_to_wav(input_path, output_path):
    # Créer le dossier temporaire s'il n'existe pas
    temp_dir = os.path.dirname(output_path)
    os.makedirs(temp_dir, exist_ok=True)
    
    command = ["ffmpeg", "-y", "-i", input_path, "-ar", "44100", "-ac", "1", output_path]
    
    # Exécuter la commande et capturer la sortie
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Vérifier si la commande a échoué et afficher les erreurs
    if result.returncode != 0:
        print(f"Erreur lors de la conversion avec ffmpeg:\nStdout: {result.stdout.decode()}\nStderr: {result.stderr.decode()}")
        # Optionnel: lever une exception pour arrêter le traitement
        # raise RuntimeError(f"FFmpeg conversion failed: {result.stderr.decode()}")

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
    original: str
    corrected: str
    wordCount: int
    speakingTime: float
    speechRate: float
    ticCounts: dict
    date: str = datetime.utcnow().isoformat()

@app.get("/sessions/", response_model=List[SessionModel])
async def get_sessions():
    sessions = []
    cursor = sessions_collection.find().sort("date", -1)
    async for document in cursor:
        document.pop("_id", None)
        sessions.append(document)
    return sessions

@app.post("/sessions/")
async def add_session(session: SessionModel):
    session_dict = session.dict()
    result = await sessions_collection.insert_one(session_dict)
    return {"inserted_id": str(result.inserted_id)}

@app.delete("/sessions/")
async def delete_sessions():
    result = await sessions_collection.delete_many({})
    return {"deleted_count": result.deleted_count}
