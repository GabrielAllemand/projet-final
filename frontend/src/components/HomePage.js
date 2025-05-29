import React, { useEffect, useRef, useState } from "react";
import styles from './HomePage.module.css'; // Import des styles CSS Module

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
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/sessions/")
      .then((res) => res.json())
      .then((data) => setHistory(data || []))
      .catch(() => setHistory([]));
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setAudioChunks([]);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16
        } 
      });

      // Get supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Erreur lors de l\'enregistrement audio');
        stopRecording();
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        sendAudio(audioBlob);
        setRecording(false);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Erreur lors du démarrage de l\'enregistrement: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
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
          setError(data.error);
          return;
        }

        setTranscription(data.transcription || "");
        setCorrectedText(data.corrected_transcription || "");
        setWordCount(data.word_count || 0);
        setSpeechRate(data.speech_rate || 0);
        setTicCounts(data.tic_counts || {});

        const newSession = {
          type: "transcription",
          original: data.transcription || "",
          corrected: data.corrected_transcription || "",
          wordCount: data.word_count || 0,
          speakingTime: 0,
          speechRate: data.speech_rate || 0,
          ticCounts: data.tic_counts || {},
          date: new Date().toISOString(),
          user: "anonymous"
        };
        saveHistory(newSession);
      })
      .catch((err) => {
        setError("Erreur réseau : " + err.message);
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
    setHistory([]);
  };

  return (
    <div className={styles.container}>
      <h1>Orthéloquence - Big Boss Edition</h1>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.recordButton}>
        <button onClick={recording ? stopRecording : startRecording} className={recording ? styles.dangerButton : styles.primaryButton}>
          {recording ? '⏹️ Arrêter l\'enregistrement' : '🎙️ Démarrer l\'enregistrement'}
        </button>
      </div>

      {(transcription || correctedText || wordCount > 0 || speechRate > 0 || Object.keys(ticCounts || {}).length > 0) && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Résultats de la dernière session :</h3>
          
          <p className={styles.boldText}>Transcription brute :</p>
          <p>{transcription || "Aucune transcription pour l'instant."}</p>

          <p className={styles.boldText} style={{ marginTop: '10px' }}>Texte corrigé :</p>
          <p>{correctedText || "Aucune correction pour l'instant."}</p>

          <p style={{ marginTop: '10px' }}>
            <strong>Nombre de mots :</strong> {wordCount} | <strong>Vitesse (mots/min) :</strong> {speechRate}
          </p>

          {Object.keys(ticCounts || {}).length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <p className={styles.boldText}>Tics détectés :</p>
              <ul className={styles.list}>
                {Object.entries(ticCounts || {}).map(([tic, count]) => (
                  <li key={tic} className={styles.listItem}>
                    {tic}: {count}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Historique des sessions</h2>
        {history.length === 0 ? (
          <p>Aucune session enregistrée.</p>
        ) : (
          <ul className={styles.list}>
            {history.map((session, idx) => (
              <li key={idx} className={styles.listItem}>
                <strong>Date :</strong> {new Date(session.date).toLocaleString()} <br />
                <strong>Texte corrigé :</strong> {session.corrected || ""} <br />
                <strong>Nombre de mots :</strong> {session.wordCount || 0} <br />
                <strong>Vitesse :</strong> {session.speechRate || 0} mots/min <br />
                <strong>Tics :</strong>{" "}
                {Object.entries(session.ticCounts || {})
                  .map(([tic, count]) => `${tic} (${count})`)
                  .join(", ")}
              </li>
            ))}
          </ul>
        )}
        {history.length > 0 && (
          <button onClick={clearHistory} className={styles.dangerButton} style={{ marginTop: '10px', marginRight: '0' }}>
            Vider l'historique
          </button>
        )}
      </div>
    </div>
  );
};

export default HomePage; 