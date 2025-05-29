import React, { useEffect, useRef, useState } from "react";
import styles from './ExercisesPage.module.css'; // Import des styles

export default function ExercisesPage() {
  const [exercises, setExercises] = useState({});
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [stats, setStats] = useState({
    totalExercises: 0,
    completedExercises: 0,
    averageScore: 0,
    bestCategory: "",
    bestScore: 0
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Utiliser useRef pour stocker l'instance de MediaRecorder
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    loadExercises();
    loadStats();
  }, []);

  const loadExercises = async () => {
    try {
      const res = await fetch("http://localhost:8000/exercises/list");
      const data = await res.json();
      setExercises(data);
      const firstCat = Object.keys(data)[0];
      setCategory(firstCat);
      setQuestion(data[firstCat][0]);
    } catch (error) {
      setError("Erreur lors du chargement des exercices");
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/sessions/");
      const sessions = await res.json();
      
      // Filtrer les sessions d'exercices
      const exerciseSessions = sessions.filter(s => s.type === "exercice");
      
      // Calculer les statistiques
      const stats = {
        totalExercises: exerciseSessions.length,
        completedExercises: exerciseSessions.length,
        averageScore: exerciseSessions.reduce((acc, curr) => acc + (curr.exerciseScore || 0), 0) / exerciseSessions.length || 0,
        bestCategory: "",
        bestScore: 0
      };

      // Trouver la meilleure catégorie
      const categoryScores = {};
      exerciseSessions.forEach(session => {
        if (session.exerciseCategory) {
          categoryScores[session.exerciseCategory] = (categoryScores[session.exerciseCategory] || 0) + (session.exerciseScore || 0);
        }
      });

      const bestCategory = Object.entries(categoryScores)
        .sort(([,a], [,b]) => b - a)[0];

      if (bestCategory) {
        stats.bestCategory = bestCategory[0];
        stats.bestScore = bestCategory[1];
      }

      setStats(stats);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  const handleCategoryChange = e => {
    const cat = e.target.value;
    setCategory(cat);
    setQuestion(exercises[cat][0]);
    setAnswer("");
    setResult(null);
  };

  const handleQuestionChange = e => {
    setQuestion(e.target.value);
    setAnswer("");
    setResult(null);
  };

  // Fonction pour démarrer/stopper l'enregistrement audio (basique)
  const handleRecord = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Ton navigateur ne supporte pas l'enregistrement audio.");
      }

      if (recording) {
        mediaRecorderRef.current.stop();
        setRecording(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 44100,
            sampleSize: 16
          } 
        });

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const mr = new MediaRecorder(stream, {
          mimeType: mimeType,
          audioBitsPerSecond: 128000
        });

        mediaRecorderRef.current = mr;
        let chunks = [];

        mr.ondataavailable = e => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mr.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          setAudioBlob(blob);
          chunks = [];
          stream.getTracks().forEach(track => track.stop());
        };

        mr.start(1000);
        setRecording(true);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Fonction pour sauvegarder le résultat de l'exercice
  const saveExerciseResult = async (exerciseAnswer, evaluationResult) => {
    try {
      const payload = {
        user: "big_boss",
        category,
        question,
        exerciseAnswer,
        evaluationResult
      };

      const res = await fetch("http://localhost:8000/exercises/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la sauvegarde du résultat");
      }

    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      loadStats(); // Recharger les stats après sauvegarde réussie
    }
  };

  // Envoyer la réponse texte classique
  const handleSubmitText = async e => {
    e.preventDefault();
    if (!answer.trim()) {
      setError("Réponds d'abord, big boss!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        user: "big_boss",
        category,
        question,
        answer
      };

      const res = await fetch("http://localhost:8000/exercises/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const evaluationResult = await res.json();
      setResult(evaluationResult);
      await saveExerciseResult(answer, evaluationResult);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer l'audio au backend pour transcription et évaluation orale
  const handleSubmitAudio = async () => {
    if (!audioBlob) {
      setError("Enregistre ta voix d'abord!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "repetition.webm");

      const transcribeRes = await fetch("http://localhost:8000/transcribe/", {
        method: "POST",
        body: formData
      });

      if (!transcribeRes.ok) {
        const errorData = await transcribeRes.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const transcriptionData = await transcribeRes.json();

      const evaluationPayload = {
        user: "big_boss",
        category,
        question,
        answer: transcriptionData.transcription,
        transcription_data: transcriptionData
      };

      const evaluateRes = await fetch("http://localhost:8000/exercises/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluationPayload)
      });

      if (!evaluateRes.ok) {
        const errorData = await evaluateRes.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const evaluationResult = await evaluateRes.json();
      setResult(evaluationResult);
      await saveExerciseResult(transcriptionData.transcription, evaluationResult);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Exercices d'Orthéloquence</h1>

      {/* Statistiques */}
      <div className={styles.statsSection}>
        <h2>Vos Statistiques</h2>
        <div className={styles.statsGrid}>
          <div>
            <p><strong className={styles.boldText}>Exercices complétés :</strong> {stats.completedExercises}</p>
            <p><strong className={styles.boldText}>Score moyen :</strong> {stats.averageScore.toFixed(1)}%</p>
          </div>
          <div>
            <p><strong className={styles.boldText}>Meilleure catégorie :</strong> {stats.bestCategory}</p>
            <p><strong className={styles.boldText}>Meilleur score :</strong> {stats.bestScore}%</p>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Sélection de l'exercice */}
      <div className={styles.selectionSection}>
        <select 
          value={category} 
          onChange={handleCategoryChange}
          className={styles.select}
        >
          {Object.keys(exercises).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          value={question} 
          onChange={handleQuestionChange}
          className={styles.select}
        >
          {exercises[category]?.map(q => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>

      {/* Exercice actuel */}
      <div className={styles.exerciseSection}>
        <h3>Exercice en cours :</h3>
        <p className={styles.questionText}>{question}</p>

        {/* Réponse texte */}
        {category !== "Oral" && (
          <form onSubmit={handleSubmitText} className={styles.form}>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Écris ta réponse ici..."
              className={styles.textarea}
            />
            <button 
              type="submit"
              disabled={isLoading}
              className={styles.primaryButton}
            >
              {isLoading ? "Évaluation en cours..." : "Soumettre la réponse"}
            </button>
          </form>
        )}

        {/* Enregistrement audio */}
        <div>
          <button
            onClick={handleRecord}
            className={recording ? styles.stopRecordButton : styles.recordButton}
          >
            {recording ? "⏹️ Arrêter" : "🎙️ Enregistrer"}
          </button>

          {audioBlob && (
            <button
              onClick={handleSubmitAudio}
              disabled={isLoading}
              className={styles.primaryButton}
            >
              {isLoading ? "Évaluation en cours..." : "Soumettre l'enregistrement"}
            </button>
          )}
        </div>
      </div>

      {/* Résultat */}
      {result && (
        <div className={styles.resultSection}>
          <h3 className={styles.resultTitle}>Résultat :</h3>
          <p><strong className={styles.boldText}>Score :</strong> {result.score}%</p>
          <p><strong className={styles.boldText}>Message :</strong></p>
          <p style={{ whiteSpace: "pre-line" }}>{result.message}</p>
          {result.corrections && result.corrections.length > 0 && (
            <div>
              <h4 className={styles.boldText}>Corrections :</h4>
              <ul className={styles.correctionsList}>
                {result.corrections.map((correction, index) => (
                  <li key={index} className={styles.correctionItem}>
                    <strong className={styles.boldText}>Contexte :</strong> {correction.context}<br />
                    <strong className={styles.boldText}>Message :</strong> {correction.message}<br />
                    {correction.replacements && (
                      <><strong>Suggestions :</strong> {correction.replacements.join(", ")}</>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 