import React, { useEffect, useRef, useState } from "react";
import AnimatedLogo from "./AnimatedLogo";

const HomePage = () => {
  const [recording, setRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [transcription, setTranscription] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [speechRate, setSpeechRate] = useState(0);
  const [ticCounts, setTicCounts] = useState({});
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8001/sessions/")
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch(() => setHistory([]));
  }, []);

  const startRecording = () => {
    setAudioChunks([]);
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.start();
      setRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        sendAudio(audioBlob);
        setRecording(false);
      };
    });
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const sendAudio = (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");

    fetch("http://localhost:8001/transcribe/", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          return;
        }

        setTranscription(data.transcription);
        setCorrectedText(data.corrected_transcription);
        setWordCount(data.word_count);
        setSpeechRate(data.speech_rate);
        setTicCounts(data.tic_counts);

        const newSession = {
          original: data.transcription,
          corrected: data.corrected_transcription,
          wordCount: data.word_count,
          speakingTime: 0,
          speechRate: data.speech_rate,
          ticCounts: data.tic_counts,
          date: new Date().toISOString(),
        };
        saveHistory(newSession);
      })
      .catch((err) => {
        alert("Erreur réseau : " + err.message);
      });
  };

  const saveHistory = (newSession) => {
    fetch("http://localhost:8001/sessions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newSession),
    })
      .then(() => {
        return fetch("http://localhost:8001/sessions/");
      })
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch(console.error);
  };

  const clearHistory = () => {
    fetch("http://localhost:8001/sessions/", {
      method: "DELETE",
    })
      .then(() => setHistory([]))
      .catch(console.error);
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="title">Éloquence</h1>

      <div className="card" style={{ width: "100%", maxWidth: "1200px" }}>
        <div className="flex flex-col items-center gap-10">
          {!recording ? (
            <button 
              onClick={startRecording} 
              className="action-button"
            >
              🎙️ Démarrer l'enregistrement
            </button>
          ) : (
            <button 
              onClick={stopRecording} 
              className="action-button recording"
            >
              ⏹️ Arrêter l'enregistrement
            </button>
          )}
          
          <AnimatedLogo isRecording={recording} />

          <div className="card" style={{ width: "100%" }}>
            <h3 className="subtitle">Transcription brute</h3>
            <p style={{ fontSize: "1.1em", lineHeight: "1.6" }}>{transcription || "Aucune transcription pour l'instant."}</p>

            <h3 className="subtitle mt-20">Texte corrigé</h3>
            <p style={{ fontSize: "1.1em", lineHeight: "1.6" }}>{correctedText || "Aucune correction pour l'instant."}</p>

            <div className="flex gap-10 mt-20">
              <div className="card" style={{ flex: 1, padding: "15px" }}>
                <strong style={{ fontSize: "1.1em" }}>Nombre de mots :</strong> {wordCount}
              </div>
              <div className="card" style={{ flex: 1, padding: "15px" }}>
                <strong style={{ fontSize: "1.1em" }}>Vitesse :</strong> {speechRate} mots/min
              </div>
            </div>

            {Object.keys(ticCounts).length > 0 && (
              <div className="mt-20">
                <h4 className="subtitle">Tics détectés</h4>
                <div className="flex flex-wrap gap-10">
                  {Object.entries(ticCounts).map(([tic, count]) => (
                    <div key={tic} className="card" style={{ flex: "1 1 200px", padding: "15px" }}>
                      <strong style={{ fontSize: "1.1em" }}>{tic}:</strong> {count}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-20" style={{ width: "100%", maxWidth: "1200px" }}>
        <div className="flex flex-col items-center gap-10">
          <h2 className="subtitle" style={{ margin: 0 }}>Historique des sessions</h2>
          
          <div className="flex gap-10">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="action-button"
              style={{ backgroundColor: showHistory ? "var(--accent-color)" : "var(--primary-color)" }}
            >
              {showHistory ? "Masquer l'historique" : "Afficher l'historique"}
            </button>
            <button 
              onClick={clearHistory} 
              style={{ backgroundColor: "var(--danger-color)" }}
            >
              Vider l'historique
            </button>
          </div>

          {showHistory && (
            <>
              {history.length === 0 ? (
                <p className="text-center">Aucune session enregistrée.</p>
              ) : (
                <div className="flex flex-col gap-10" style={{ width: "100%" }}>
                  {history.map((session, idx) => (
                    <div key={idx} className="card">
                      <div className="flex justify-between mb-10">
                        <strong style={{ fontSize: "1.1em" }}>Date :</strong> {new Date(session.date).toLocaleString()}
                      </div>
                      <p style={{ fontSize: "1.1em", lineHeight: "1.6" }}><strong>Texte corrigé :</strong> {session.corrected}</p>
                      <div className="flex gap-10 mt-10">
                        <div className="card" style={{ flex: 1, padding: "15px" }}>
                          <strong style={{ fontSize: "1.1em" }}>Nombre de mots :</strong> {session.wordCount}
                        </div>
                        <div className="card" style={{ flex: 1, padding: "15px" }}>
                          <strong style={{ fontSize: "1.1em" }}>Vitesse :</strong> {session.speechRate} mots/min
                        </div>
                      </div>
                      {Object.keys(session.ticCounts).length > 0 && (
                        <div className="mt-10">
                          <strong style={{ fontSize: "1.1em" }}>Tics :</strong>{" "}
                          {Object.entries(session.ticCounts)
                            .map(([tic, count]) => `${tic} (${count})`)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 