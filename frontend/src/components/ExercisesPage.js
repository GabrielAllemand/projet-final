import React, { useEffect, useRef, useState } from "react";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState({});
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  // Utiliser useRef pour stocker l'instance de MediaRecorder
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/exercises/list")
      .then(res => res.json())
      .then(data => {
        setExercises(data);
        const firstCat = Object.keys(data)[0];
        setCategory(firstCat);
        setQuestion(data[firstCat][0]);
      });
  }, []);

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
  const handleRecord = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Ton navigateur ne supporte pas l'enregistrement audio.");
      return;
    }

    if (recording) {
      // Stop recording
      mediaRecorderRef.current.stop(); // Utiliser mediaRecorderRef.current
      setRecording(false);
    } else {
      // Start recording
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr; // Assigner à mediaRecorderRef.current
        let chunks = [];
        mr.ondataavailable = e => chunks.push(e.data);
        mr.onstop = e => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          setAudioBlob(blob);
          chunks = [];
        };
        mr.start();
        setRecording(true);
      });
    }
  };

  // Envoyer la réponse texte classique
  const handleSubmitText = async e => {
    e.preventDefault();
    if (!answer.trim()) return alert("Réponds d'abord, big boss!");

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
    const data = await res.json();
    setResult(data);
  };

  // Envoyer l'audio au backend pour transcription et évaluation orale
  const handleSubmitAudio = async () => {
    if (!audioBlob) return alert("Enregistre ta voix d'abord!");

    const formData = new FormData();
    formData.append("file", audioBlob, "repetition.webm");

    // Étape 1: Envoyer l'audio pour transcription
    const transcribeRes = await fetch("http://localhost:8000/transcribe/", {
      method: "POST",
      body: formData
    });

    const transcriptionData = await transcribeRes.json();
    if (transcriptionData.error) {
      alert(transcriptionData.error);
      return;
    }

    // Étape 2: Envoyer les données de transcription (et autres détails de l'exercice) pour évaluation
    const evaluationPayload = {
      user: "big_boss",
      category,
      question,
      answer: transcriptionData.transcription, // Envoyer la transcription brute comme réponse texte principale si besoin
      transcription_data: transcriptionData // Inclure toutes les données de transcription
    };

    const evaluateRes = await fetch("http://localhost:8000/exercises/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evaluationPayload)
    });

    const evaluationResult = await evaluateRes.json();
    setResult(evaluationResult);

     // Optionnel: réinitialiser l'audio Blob après évaluation si vous ne voulez pas qu'il reste dans le lecteur
    // setAudioBlob(null);
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20, fontFamily: "Arial" }}>
      <h2>Exercices pour s'entraîner</h2>

      <label>
        Catégorie :{" "}
        <select value={category} onChange={handleCategoryChange}>
          {Object.keys(exercises).map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>

      <br />
      <br />

      <label>
        Exercice :{" "}
        <select value={question} onChange={handleQuestionChange}>
          {exercises[category]?.map((q, i) => (
            <option key={i} value={q}>
              {q}
            </option>
          ))}
        </select>
      </label>

      <br />
      <br />

      {category !== "Oral" ? (
        <form onSubmit={handleSubmitText}>
          <textarea
            rows={5}
            placeholder="Ta réponse ici..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            style={{ width: "100%SansSerif", fontSize: 16 }}
          />
          <br />
          <br />
          <button type="submit">Envoyer</button>
        </form>
      ) : (
        <div>
          <p>
            <i>{question.replace(/^Répète ce texte : /, "")}</i>
          </p>

          <button onClick={handleRecord}>
            {recording ? "Stopper l'enregistrement" : "Commencer à enregistrer"}
          </button>

          <br />
          <br />

          {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}

          <br />

          <button onClick={handleSubmitAudio} disabled={!audioBlob}>
            Envoyer l'audio pour évaluation
          </button>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 20,
            backgroundColor: "#eee",
            padding: 15,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            border: "1px solid #ccc"
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Résultat de l'évaluation</h3>

          <p style={{ fontSize: 18, fontWeight: "bold", color: result.score > 75 ? "green" : result.score > 50 ? "orange" : "red" }}>
            Score : {result.score}/100
          </p>

          <p>{result.message}</p>

          {result.corrections && result.corrections.length > 0 && (
            <div style={{ marginTop: 15 }}>
              <h4>Corrections suggérées :</h4>
              <ul>
                {result.corrections.map((c, i) => (
                  <li key={i} style={{ marginBottom: 10 }}>
                    <b>Erreur :</b> "{c.context}" — <i>{c.message}</i>
                    {c.replacements && c.replacements.length > 0 && (
                      <> <br /> <b>Suggestions :</b> {c.replacements.join(", ")}</>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.transcription_data && (
            <div style={{ marginTop: 15 }}>
              <h4>Analyse de votre parole :</h4>
              <p><b>Transcription brute :</b> {result.transcription_data.transcription}</p>
              <p><b>Transcription corrigée :</b> {result.transcription_data.corrected_transcription}</p>
              <p><b>Nombre de mots :</b> {result.transcription_data.word_count}</p>
              <p><b>Vitesse de parole :</b> {result.transcription_data.speech_rate} mots/min</p>
              <p><b>Tics de langage détectés :</b> {JSON.stringify(result.transcription_data.tic_counts)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 