import language_tool_python
from fastapi import APIRouter
from pydantic import BaseModel

# Assurez-vous que l'instance de LanguageTool est créée
try:
    tool = language_tool_python.LanguageTool('fr')
except Exception as e:
    print(f"Erreur lors de l'initialisation de LanguageTool: {e}")
    tool = None # Gérer le cas où l'outil ne peut pas être initialisé


router = APIRouter()

EXERCISES = {
    "Grammaire": [
        "Corrige la phrase : 'Il ont mangé les pommes.'",
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

class ExerciseEvaluationRequest(BaseModel):
    user: str
    category: str
    question: str
    answer: str # Réponse texte de l'utilisateur (peut aussi servir pour la transcription brute initiale)
    transcription_data: dict | None = None # Ajouter ce champ pour les données de transcription orale

class EvaluationResult(BaseModel):
    score: int
    message: str
    corrections: list = [] # Liste des corrections LanguageTool
    transcription_data: dict | None = None # Pour les résultats de transcription si applicable


@router.get("/list")
def get_exercises():
    return EXERCISES

@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_exercise(request: ExerciseEvaluationRequest):
    # Trouver l'exercice correspondant (vérification basique)
    if request.category not in EXERCISES or request.question not in EXERCISES[request.category]:
        return EvaluationResult(score=0, message="Exercice ou catégorie invalide.")

    # Logique d'évaluation
    if request.category != "Oral":
        # Évaluation pour les exercices texte (Grammaire, Vocabulaire)
        if tool:
            matches = tool.check(request.answer)
            corrected_text = language_tool_python.utils.correct(request.answer, matches)
            
            corrections_list = []
            score = 100 # Score initial parfait
            if matches:
                score = max(0, 100 - (len(matches) * 10)) # Exemple simple de scoring basé sur le nombre d'erreurs
                for match in matches:
                     corrections_list.append({
                         "context": match.context,
                         "message": match.message,
                         "replacements": match.replacements
                     })

            message = f"Votre réponse : {request.answer}\nCorrection suggérée : {corrected_text}"
            return EvaluationResult(score=score, message=message, corrections=corrections_list)
        else:
             return EvaluationResult(score=0, message="Outil de correction linguistique non disponible.")
             
    else:
        # Évaluation pour les exercices oraux améliorée
        if request.transcription_data:
            transcription = request.transcription_data.get("transcription", "").strip()
            corrected_transcription = request.transcription_data.get("corrected_transcription", "").strip()
            word_count = request.transcription_data.get("word_count", 0)
            speech_rate = request.transcription_data.get("speech_rate", 0)
            tic_counts = request.transcription_data.get("tic_counts", {})
            
            expected_text = request.question.replace("Répète ce texte : ", "").strip()

            # Logique d'évaluation orale améliorée
            score = 100 # Score initial
            feedback_message = f"Exercice : {request.question}\n\nVotre transcription brute : {transcription}\nTranscription corrigée : {corrected_transcription}\n"

            # Comparaison de la transcription corrigée avec le texte attendu (casse-insensible pour la comparaison simple)
            if corrected_transcription.lower() != expected_text.lower():
                 # Pénalité pour différence de contenu
                 score = max(0, score - 40) # Exemple: -40 points si le contenu n'est pas exactement correct
                 feedback_message += f"\n💡 Conseil : La transcription ne correspond pas exactement au texte attendu."
                 # Idéalement, ici on calculerait une similarité pour un score partiel

            # Pénalité pour les tics de langage
            total_tics = sum(tic_counts.values())
            if total_tics > 0:
                 tic_penalty = total_tics * 5 # Exemple: -5 points par tic
                 score = max(0, score - tic_penalty)
                 feedback_message += f"\n\n🤔 Tics détectés : {', '.join([f'{tic} ({count})' for tic, count in tic_counts.items()])}. Essayez de les réduire !"
            else:
                 feedback_message += "\n\n🎉 Aucun tic détecté !"
                 
            # Feedback sur la vitesse de parole (sans impact sur le score pour l'instant)
            if word_count > 0 and speech_rate > 0:
                 feedback_message += f"\n\n⏱ Vitesse de parole : {speech_rate:.1f} mots/min."
                 # Vous pourriez ajouter ici une logique pour commenter la vitesse (trop rapide/lente) si vous avez des seuils cibles.

            # S'assurer que le score ne descend pas en dessous de zéro
            score = max(0, score)

            return EvaluationResult(
                score=score,
                message=feedback_message,
                transcription_data=request.transcription_data # Renvoyer les données de transcription complètes
            )
        else:
             return EvaluationResult(score=0, message="Données de transcription manquantes pour l'évaluation orale.")

@router.get("/")
async def read_exercises():
    return {"message": "Exercises router is working"} 