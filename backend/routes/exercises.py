from datetime import datetime
import language_tool_python
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import BaseModel
from typing import Optional

# Initialisation LanguageTool
try:
    tool = language_tool_python.LanguageTool('fr')
except Exception as e:
    print(f"Erreur LanguageTool: {e}")
    tool = None

# EXERCICES
EXERCISES = {
    "Grammaire": [
        "Corrige la phrase : 'Il ont mangé les pommes.'",
        "Corrige la phrase suivante : 'Je mange une pomme.'",
        "Corrige la phrase suivante : 'Tu mange une pomme.'",
        "Corrige la phrase suivante : 'Il mange une pomme.'",
        "Corrige la phrase suivante : 'Nous mangeons une pomme.'",
        "Corrige la phrase suivante : 'Vous mangez une pomme.'",
        "Corrige la phrase suivante : 'Ils mangent une pomme.'",
        "Corrige la phrase suivante : 'Il mangeons une pizza.'",
        "Corrige la phrase suivante : 'Tu fini ton travail trop tard.'",
        "Corrige la phrase suivante : 'Nous fais du sport chaque semaine.'",
        "Corrige la phrase suivante : 'Elles prends le bus à 8h.'",
        "Corrige la phrase suivante : 'Je regardes un film intéressant.'",
        "Corrige la phrase suivante : 'Vous vas au marché ?'",
        "Corrige la phrase suivante : 'On jouent dans le jardin.'",
        "Transforme cette phrase au passé composé."
    ],
    "Vocabulaire": [
        "Trouve le synonyme de 'rapide'.",
        "Donne une phrase avec le mot 'éloquent'."
    ],
    "Oral": [
        "Répète ce texte : Les chaussettes de l'archiduchesse sont-elles sèches, archi-sèches ?",
        "Répète ce virelangue : Un chasseur sachant chasser doit savoir chasser sans son chien."
    ]
}

# Schémas
class ExerciseEvaluationRequest(BaseModel):
    user: str
    category: str
    question: str
    answer: str
    transcription_data: Optional[dict] = None

class EvaluationResult(BaseModel):
    score: int
    message: str
    corrections: list = []
    transcription_data: Optional[dict] = None

class SaveExerciseResultRequest(BaseModel):
    user: str
    category: str
    question: str
    exerciseAnswer: str
    evaluationResult: EvaluationResult

# Création du router avec collection
def create_router(sessions_collection: AsyncIOMotorCollection) -> APIRouter:
    router = APIRouter()

    @router.get("/list")
    def get_exercises():
        return EXERCISES

    @router.post("/evaluate", response_model=EvaluationResult)
    async def evaluate_exercise(request: ExerciseEvaluationRequest):
        if request.category not in EXERCISES or request.question not in EXERCISES[request.category]:
            return EvaluationResult(score=0, message="Exercice ou catégorie invalide.")

        if request.category != "Oral":
            if tool:
                matches = tool.check(request.answer)
                corrected_text = language_tool_python.utils.correct(request.answer, matches)
                corrections_list = []
                score = 100
                if matches:
                    score = max(0, 100 - len(matches) * 10)
                    for match in matches:
                        corrections_list.append({
                            "context": match.context,
                            "message": match.message,
                            "replacements": match.replacements
                        })
                message = f"Votre réponse : {request.answer}\nCorrection suggérée : {corrected_text}"
                return EvaluationResult(score=score, message=message, corrections=corrections_list)
            else:
                return EvaluationResult(score=0, message="Outil non disponible.")

        else:
            if request.transcription_data:
                transcription = request.transcription_data.get("transcription", "").strip()
                corrected_transcription = request.transcription_data.get("corrected_transcription", "").strip()
                word_count = request.transcription_data.get("word_count", 0)
                speech_rate = request.transcription_data.get("speech_rate", 0)
                tic_counts = request.transcription_data.get("tic_counts", {})
                expected_text = request.question.replace("Répète ce texte : ", "").strip()

                score = 100
                feedback_message = f"Votre transcription brute : {transcription}\nCorrection : {corrected_transcription}"

                if corrected_transcription.lower() != expected_text.lower():
                    score = max(0, score - 40)
                    feedback_message += "\n💡 Conseil : Le contenu ne correspond pas totalement."

                total_tics = sum(tic_counts.values())
                if total_tics > 0:
                    tic_penalty = total_tics * 5
                    score = max(0, score - tic_penalty)
                    feedback_message += f"\n🤔 Tics détectés : {', '.join([f'{k} ({v})' for k, v in tic_counts.items()])}."

                if word_count > 0:
                    feedback_message += f"\n⏱ Vitesse : {speech_rate:.1f} mots/min"

                return EvaluationResult(score=score, message=feedback_message, transcription_data=request.transcription_data)

            return EvaluationResult(score=0, message="Aucune transcription fournie.")

    return router
