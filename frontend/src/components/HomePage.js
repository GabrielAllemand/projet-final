import React, { useEffect, useRef, useState } from "react";

const HomePage = () => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [transcription, setTranscription] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [speechRate, setSpeechRate] = useState(0);
  const [ticCounts, setTicCounts] = useState({});
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/sessions/")
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

    fetch("http://localhost:8000/transcribe/", {
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
    fetch("http://localhost:8000/sessions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newSession),
    })
      .then(() => {
        return fetch("http://localhost:8000/sessions/");
      })
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch(console.error);
  };

  const clearHistory = () => {
    fetch("http://localhost:8000/sessions/", {
      method: "DELETE",
    })
      .then(() => setHistory([]))
      .catch(console.error);
  };

  return (
    <div>
      <h1>Orthéloquence - Big Boss Edition</h1>

      {!recording ? (
        <button onClick={startRecording} style={{ fontSize: 20, padding: "10px 20px" }}>
          🎙️ Démarrer l'enregistrement
        </button>
      ) : (
        <button onClick={stopRecording} style={{ fontSize: 20, padding: "10px 20px", backgroundColor: "#f44336", color: "white" }}>
          ⏹️ Arrêter l'enregistrement
        </button>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Transcription brute :</h3>
        <p>{transcription || "Aucune transcription pour l'instant."}</p>

        <h3>Texte corrigé :</h3>
        <p>{correctedText || "Aucune correction pour l'instant."}</p>

        <p>
          <strong>Nombre de mots :</strong> {wordCount} | <strong>Vitesse (mots/min) :</strong> {speechRate}
        </p>

        <h4>Tics détectés :</h4>
        <ul>
          {Object.entries(ticCounts).map(([tic, count]) => (
            <li key={tic}>
              {tic}: {count}
            </li>
          ))}
        </ul>
      </div>

      <hr />

      <div>
        <h2>Historique des sessions</h2>
        {history.length === 0 ? (
          <p>Aucune session enregistrée.</p>
        ) : (
          <ul>
            {history.map((session, idx) => (
              <li key={idx} style={{ marginBottom: 15 }}>
                <strong>Date :</strong> {new Date(session.date).toLocaleString()} <br />
                <strong>Texte corrigé :</strong> {session.corrected} <br />
                <strong>Nombre de mots :</strong> {session.wordCount} <br />
                <strong>Vitesse :</strong> {session.speechRate} mots/min <br />
                <strong>Tics :</strong>{" "}
                {Object.entries(session.ticCounts)
                  .map(([tic, count]) => `${tic} (${count})`)
                  .join(", ")}
              </li>
            ))}
          </ul>
        )}
        <button onClick={clearHistory} style={{ marginTop: 10, backgroundColor: "#f44336", color: "white", padding: "8px 12px" }}>
          Vider l'historique
        </button>
      </div>
    </div>
  );
};

export default HomePage; 