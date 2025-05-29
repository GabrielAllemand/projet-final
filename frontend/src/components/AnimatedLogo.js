import React, { useEffect, useRef } from 'react';

const AnimatedLogo = ({ isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (isRecording) {
      startAudioAnalysis();
    } else {
      stopAudioAnalysis();
    }

    return () => {
      isMountedRef.current = false;
      stopAudioAnalysis();
    };
  }, [isRecording]);

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isMountedRef.current) return;
      
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const animate = () => {
        if (!isMountedRef.current || !audioContextRef.current) return;
        
        animationRef.current = requestAnimationFrame(animate);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const scale = 1 + (average / 128) * 0.2;
        
        drawLogo(scale);
      };
      
      animate();
    } catch (error) {
      console.error('Erreur lors de l\'accès au microphone:', error);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;

    if (isMountedRef.current && canvasRef.current) {
      drawLogo(1);
    }
  };

  const drawLogo = (scale = 1) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8 * scale;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le cercle extérieur
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#c5a47e';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Dessiner le cercle intérieur
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
    ctx.strokeStyle = '#1a237e';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dessiner les ondes sonores
    const waveCount = 3;
    for (let i = 0; i < waveCount; i++) {
      const waveRadius = radius * (0.8 + i * 0.2) * scale;
      ctx.beginPath();
      ctx.arc(centerX, centerY, waveRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(197, 164, 126, ${0.3 - i * 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{
        margin: '20px auto',
        display: 'block',
        transition: 'transform 0.1s ease-out'
      }}
    />
  );
};

export default AnimatedLogo; 