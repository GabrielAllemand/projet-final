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
    fetch("http://localhost:8001/exercises/list")
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

    const res = await fetch("http://localhost:8001/exercises/evaluate", {
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
    const transcribeRes = await fetch("http://localhost:8001/transcribe/", {
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

    const evaluateRes = await fetch("http://localhost:8001/exercises/evaluate", {
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
    <div className="flex flex-col items-center" style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <h1 className="title" style={{ fontSize: "4em", marginBottom: "40px" }}>Exercices</h1>

      <div style={{ width: "100%", maxWidth: "1400px" }}>
        {/* Section de sélection */}
        <div className="flex flex-col gap-30" style={{ marginBottom: "40px" }}>
          <div className="flex flex-col gap-20">
            <h2 className="subtitle" style={{ fontSize: "2em", marginBottom: "20px" }}>Catégorie</h2>
            <div className="flex flex-wrap gap-10">
              {Object.keys(exercises).map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange({ target: { value: cat } })}
                  className="action-button"
                  style={{ 
                    padding: "15px 30px",
                    fontSize: "1.2em",
                    backgroundColor: category === cat ? "var(--accent-color)" : "var(--primary-color)",
                    color: "white",
                    minWidth: "200px"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

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
                cursor: "pointer"
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

          {/* Affichage de la phrase sélectionnée */}
          {question && (
            <div className="flex flex-col gap-20">
              <h2 className="subtitle" style={{ fontSize: "2em", marginBottom: "20px" }}>Phrase à corriger</h2>
              <div className="card" style={{ 
                padding: "30px", 
                width: "100%", 
                backgroundColor: "var(--background-color)",
                textAlign: "center"
              }}>
                <p style={{ 
                  fontSize: "1.8em", 
                  fontStyle: "italic", 
                  color: "var(--text-color)",
                  lineHeight: "1.4"
                }}>
                  {question.replace(/^Corrige les erreurs de conjugaison dans la phrase suivante : /, "")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section de réponse */}
        <div className="card" style={{ padding: "40px", marginBottom: "40px" }}>
          {category !== "Oral" ? (
            <form onSubmit={handleSubmitText}>
              <textarea
                rows={5}
                placeholder="Écrivez votre réponse ici..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "20px", 
                  fontSize: "1.3em",
                  backgroundColor: "var(--background-color)",
                  border: "none",
                  borderRadius: "8px",
                  minHeight: "200px",
                  marginBottom: "30px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="action-button"
                  style={{ 
                    padding: "15px 40px",
                    fontSize: "1.3em",
                    backgroundColor: "var(--accent-color)"
                  }}
                >
                  Envoyer
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-30">
              <div className="card" style={{ 
                padding: "30px", 
                width: "100%", 
                backgroundColor: "var(--background-color)",
                textAlign: "center"
              }}>
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
                  minWidth: "300px"
                }}
              >
                {recording ? "⏹️ Arrêter l'enregistrement" : "🎙️ Commencer à enregistrer"}
              </button>

              {audioBlob && (
                <div className="flex flex-col items-center gap-20" style={{ width: "100%" }}>
                  <audio 
                    controls 
                    src={URL.createObjectURL(audioBlob)}
                    style={{ width: "100%", maxWidth: "600px" }}
                  />
                  <button 
                    onClick={handleSubmitAudio} 
                    disabled={!audioBlob}
                    className="action-button"
                    style={{ 
                      padding: "15px 40px",
                      fontSize: "1.3em",
                      backgroundColor: "var(--accent-color)",
                      opacity: audioBlob ? 1 : 0.5
                    }}
                  >
                    Envoyer l'audio pour évaluation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section des résultats */}
        {result && (
          <div className="card" style={{ padding: "40px" }}>
            <div className="flex flex-col items-center gap-30">
              <div className="flex items-center gap-20">
                <h2 className="subtitle" style={{ fontSize: "2em", margin: 0 }}>Résultat</h2>
                <div style={{ 
                  padding: "15px 30px",
                  backgroundColor: result.score > 75 ? "var(--success-color)" : 
                                result.score > 50 ? "var(--warning-color)" : 
                                "var(--danger-color)",
                  color: "white",
                  fontSize: "1.6em",
                  borderRadius: "8px"
                }}>
                  {result.score}/100
                </div>
              </div>

              <div className="card" style={{ 
                width: "100%", 
                padding: "30px",
                backgroundColor: "var(--background-color)"
              }}>
                <p style={{ fontSize: "1.3em", lineHeight: "1.6" }}>{result.message}</p>
              </div>

              {result.corrections && result.corrections.length > 0 && (
                <div style={{ width: "100%" }}>
                  <h3 className="subtitle" style={{ fontSize: "1.8em", marginBottom: "20px" }}>
                    Corrections suggérées
                  </h3>
                  <div className="flex flex-col gap-15">
                    {result.corrections.map((c, i) => (
                      <div key={i} className="card" style={{ 
                        padding: "20px",
                        backgroundColor: "var(--background-color)"
                      }}>
                        <p style={{ fontSize: "1.2em", marginBottom: "10px" }}>
                          <strong>Erreur :</strong> "{c.context}"
                        </p>
                        <p style={{ fontSize: "1.2em", marginBottom: "10px", color: "var(--accent-color)" }}>
                          <i>{c.message}</i>
                        </p>
                        {c.replacements && c.replacements.length > 0 && (
                          <p style={{ fontSize: "1.2em" }}>
                            <strong>Suggestions :</strong> {c.replacements.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.transcription_data && (
                <div style={{ width: "100%" }}>
                  <h3 className="subtitle" style={{ fontSize: "1.8em", marginBottom: "20px" }}>
                    Analyse de votre parole
                  </h3>
                  <div className="flex flex-col gap-20">
                    <div className="card" style={{ 
                      padding: "20px",
                      backgroundColor: "var(--background-color)"
                    }}>
                      <p style={{ fontSize: "1.2em", marginBottom: "10px" }}>
                        <strong>Transcription brute :</strong> {result.transcription_data.transcription}
                      </p>
                      <p style={{ fontSize: "1.2em" }}>
                        <strong>Transcription corrigée :</strong> {result.transcription_data.corrected_transcription}
                      </p>
                    </div>

                    <div className="flex gap-20">
                      <div className="card" style={{ 
                        flex: 1, 
                        padding: "20px",
                        backgroundColor: "var(--background-color)"
                      }}>
                        <strong style={{ fontSize: "1.2em" }}>Nombre de mots :</strong> {result.transcription_data.word_count}
                      </div>
                      <div className="card" style={{ 
                        flex: 1, 
                        padding: "20px",
                        backgroundColor: "var(--background-color)"
                      }}>
                        <strong style={{ fontSize: "1.2em" }}>Vitesse de parole :</strong> {result.transcription_data.speech_rate} mots/min
                      </div>
                    </div>

                    {Object.keys(result.transcription_data.tic_counts).length > 0 && (
                      <div className="card" style={{ 
                        padding: "20px",
                        backgroundColor: "var(--background-color)"
                      }}>
                        <strong style={{ fontSize: "1.2em", marginBottom: "15px", display: "block" }}>
                          Tics de langage détectés
                        </strong>
                        <div className="flex flex-wrap gap-10">
                          {Object.entries(result.transcription_data.tic_counts).map(([tic, count]) => (
                            <div key={tic} className="card" style={{ 
                              padding: "10px 20px",
                              backgroundColor: "var(--primary-color)",
                              color: "white"
                            }}>
                              {tic}: {count}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 