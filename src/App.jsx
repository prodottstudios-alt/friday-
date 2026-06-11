// src/App.jsx
import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const videoRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // Start webcam
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error("Camera error:", e);
      }
    }
    startCamera();
  }, []);

  async function askGemini() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await resp.json();
      setAnswer(data.reply || "No reply");
    } catch (e) {
      console.error(e);
      setAnswer("Error contacting Gemini");
    } finally {
      setLoading(false);
    }
  }

  const onKey = e => {
    if (e.key === "Enter") askGemini();
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "linear-gradient(135deg, #0d0d0d, #202020)",
        color: "#fff",
        minHeight: "100vh",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", margin: 0 }}>✨ Gemini Camera Assistant</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: "12px",
          boxShadow: "0 0 30px rgba(0,255,255,0.2)",
        }}
      />
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <input
          type="text"
          placeholder="Ask Gemini (e.g. ‘What’s the weather?’)"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={onKey}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
            background: "#222",
            color: "#fff",
          }}
        />
        <button
          onClick={askGemini}
          disabled={loading}
          style={{
            marginTop: "0.6rem",
            width: "100%",
            padding: "0.8rem",
            borderRadius: "8px",
            border: "none",
            background: "#00bcd4",
            color: "#000",
            fontWeight: "600",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
        >
          {loading ? "…thinking" : "Ask Gemini"}
        </button>
      </div>
      {answer && (
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            padding: "1rem",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p style={{ margin: 0, lineHeight: "1.4" }}>{answer}</p>
        </div>
      )}
      <footer style={{ marginTop: "auto", opacity: 0.6 }}>
        © Sahil | Built with Vite + React + Gemini
      </footer>
    </div>
  );
}
