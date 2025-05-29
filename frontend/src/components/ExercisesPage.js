import React, { useState } from "react";
import styles from "./YourStyles.module.css"; // adapte selon ton projet

export default function ExerciseComponent({ exercises }) {
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Gestion du changement de catégorie
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setQuestion("");
    setAnswer("");
    setResult(null);
    setAudioBlob(null);
  };

  // Gestion du changement d'exercice (question)
  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    setAnswer("");
    setResult(null);
    setAudioBlob(null);
  };

  // Soumission de la réponse texte
  const handleSubmitText = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const evaluationPayload = {
      user: "big_boss",
      category,
      question,
      answer,
      transcription_data: null,
    };

    const res = await fetch("http://localhost:8001/exercises/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evaluationPayload),
    });

    const data = await res.json();
    setResult(data);
    setIsLoading(false);
  };

  // Enregistrement audio (simplifié ici, à adapter avec la vraie logique d'enregistrement)
  const handleRecord = () => {
    if (recording) {
      // Arrêter l'enregistrement
      setRecording(false);
      // Ici tu dois gérer la création du Blob audio, par exemple
      // setAudioBlob(blob);
    } else {
      // Commencer l'enregistrement
      setRecording(true);
      // Logique d'enregistrement ici...
      setAudioBlob(null);
    }
  };

  // Soumission de l'audio enregistré
  const handleSubmitAudio = async () => {
    if (!audioBlob) return;
    setIsLoading(true);

    // Exemple d'envoi d'audio + transcription simulée
    const transcriptionData = {
      transcription: "Texte transcrit depuis l'audio",
      corrected_transcription: "Texte corrigé",
      word_count: 50,
      speech_rate: 120,
      tic_counts: { "euh": 3, "bon": 1 },
    };

    const evaluationPayload = {
      user: "big_boss",
      category,
      question,
      answer: transcriptionData.transcription,
      transcription_data: transcriptionData,
    };

    const res = await fetch("http://localhost:8001/exercises/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evaluationPayload),
    });

    const data = await res.json();
    setResult(data);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center" style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <h1 className="title" style={{ fontSize: "4em", marginBottom: "40px" }}>Exercices</h1>

      <div style={{ width: "100%", maxWidth: "1400px" }}>
        {/* Sélection catégorie */}
        <div className="flex flex-col gap-30" style={{ marginBottom: "40px" }}>
          <div className="flex flex-col gap-20">
            <h2 className="subtitle" style={{ fontSize: "2em", marginBottom: "20px" }}>Catégorie</h2>
            <div className="flex flex-wrap gap-10">
              {Object.keys(exercises).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange({ target: { value: cat } })}
                  className="action-button"
                  style={{
                    padding: "15px 30px",
                    fontSize: "1.2em",
                    backgroundColor: category === cat ? "var(--accent-color)" : "var(--primary-color)",
                    color: "white",
                    minWidth: "200px",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sélection exercice/question */}
          <div className="flex flex-col gap-20">
            <h2 className="subtitle" style={{ fontSize: "2em", marginBottom: "20px" }}>Exercice</h2>
            <select
              value={question}
              onChange={handleQuestionChange}
              className="action-button"
              style={{
                width: "100%",
                padding: "20px",
                fontSize: "1.4em",
                backgroundColor: "var(--primary-color)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <option value="">Sélectionnez un exercice</option>
              {exercises[category]?.map((q, i) => (
                <option key={i} value={q}>
                  {q.replace(/^Corrige les erreurs de conjugaison dans la phrase suivante : /, "")}
                </option>
              ))}
            </select>
          </div>

          {/* Phrase sélectionnée */}
          {question && (
            <div className="flex flex-col gap-20">
              <h2 className="subtitle" style={{ fontSize: "2em", marginBottom: "20px" }}>Phrase à corriger</h2>
              <div
                className="card"
                style={{
                  padding: "30px",
                  width: "100%",
                  backgroundColor: "var(--background-color)",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "1.8em",
                    fontStyle: "italic",
                    color: "var(--text-color)",
                    lineHeight: "1.4",
                  }}
                >
                  {question.replace(/^Corrige les erreurs de conjugaison dans la phrase suivante : /, "")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section réponse */}
        <div className="card" style={{ padding: "40px", marginBottom: "40px" }}>
          {category !== "Oral" ? (
            <form onSubmit={handleSubmitText}>
              <textarea
                rows={5}
                placeholder="Écrivez votre réponse ici..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                style={{
                  width: "100%",
                  padding: "20px",
                  fontSize: "1.3em",
                  backgroundColor: "var(--background-color)",
                  border: "none",
                  borderRadius: "8px",
                  minHeight: "200px",
                  marginBottom: "30px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="action-button"
                  style={{
                    padding: "15px 40px",
                    fontSize: "1.3em",
                    backgroundColor: "var(--accent-color)",
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? "Évaluation en cours..." : "Envoyer"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-30">
              <div
                className="card"
                style={{
                  padding: "30px",
                  width: "100%",
                  backgroundColor: "var(--background-color)",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "1.8em", fontStyle: "italic", color: "var(--text-color)" }}>
                  {question.replace(/^Répète ce texte : /, "")}
                </p>
              </div>

              <button
                onClick={handleRecord}
                className="action-button"
                style={{
                  padding: "20px 40px",
                  fontSize: "1.4em",
                  backgroundColor: recording ? "var(--accent-color)" : "var(--primary-color)",
                  minWidth: "300px",
                  cursor: "pointer",
                }}
              >
                {recording ? "⏹️ Arrêter l'enregistrement" : "🎙️ Commencer à enregistrer"}
              </button>

              {audioBlob && (
                <div className="flex flex-col items-center gap-20" style={{ width: "100%" }}>
                  <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: "100%", maxWidth: "600px" }} />
                  <button
                    onClick={handleSubmitAudio}
                    disabled={isLoading}
                    className="action-button"
                    style={{
                      padding: "15px 40px",
                      fontSize: "1.3em",
                      backgroundColor: "var(--accent-color)",
                      cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {isLoading ? "Analyse en cours..." : "Envoyer l'audio"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Affichage des résultats */}
        {result && (
          <div
            className="card"
            style={{
              padding: "30px",
              width: "100%",
              backgroundColor: "var(--background-color)",
              color: "var(--text-color)",
              lineHeight: "1.4",
              fontSize: "1.2em",
              whiteSpace: "pre-wrap",
            }}
          >
            <h2 style={{ fontSize: "2em", marginBottom: "20px" }}>Résultat</h2>
            <p>Score : {result.score ?? "N/A"}</p>
            <p>Message : {result.message ?? "Aucun message"}</p>
            {result.corrected_answer && (
              <>
                <h3>Correction :</h3>
                <p>{result.corrected_answer}</p>
              </>
            )}
            {result.details && (
              <>
                <h3>Détails :</h3>
                <pre>{JSON.stringify(result.details, null, 2)}</pre>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
