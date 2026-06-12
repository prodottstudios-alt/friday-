// src/App.jsx
import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [answer, setAnswer] = useState("");
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Standby");

  // Start webcam
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error("Camera error:", e);
        setStatus("Camera access failed");
      }
    }
    startCamera();
  }, []);

  // Capture frame and send to backend
  const captureFrameAndSend = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas image to base64 jpeg
    const base64Image = canvas.toDataURL("image/jpeg", 0.7);

    setStatus("Analyzing...");
    try {
      const resp = await fetch("/api/upload-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await resp.json();
      if (data.reply && data.reply !== "[NO_OUTPUT]" && !data.reply.includes("[NO_OUTPUT]")) {
        setAnswer(data.reply);
        setActive(false); // Turn off after greeting once
        setStatus("Greeted. Mac Mic Active!");
      } else {
        setStatus("Watching...");
      }
    } catch (e) {
      console.error(e);
      setStatus("Error sending frame");
    }
  };

  // Loop timer
  useEffect(() => {
    let intervalId = null;
    if (active) {
      setStatus("Watching...");
      // Capture frame immediately on activation
      captureFrameAndSend();
      // Then repeat every 6 seconds
      intervalId = setInterval(captureFrameAndSend, 6000);
    } else {
      setStatus("Standby");
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [active]);

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "linear-gradient(135deg, #0d0d0d, #1a1a2e)",
        color: "#fff",
        minHeight: "100vh",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", margin: 0, letterSpacing: "1px", textShadow: "0 0 10px rgba(0, 255, 200, 0.4)" }}>
        👁️ Friday Eye
      </h1>

      <div style={{ position: "relative", width: "100%", maxWidth: "480px" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            borderRadius: "16px",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            boxShadow: active ? "0 0 30px rgba(0, 255, 200, 0.3)" : "0 0 15px rgba(0,0,0,0.5)",
            transform: "scaleX(-1)", // Mirror effect
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: active ? "rgba(0, 255, 128, 0.2)" : "rgba(255, 255, 255, 0.1)",
            color: active ? "#00ff80" : "#ccc",
            padding: "0.3rem 0.8rem",
            borderRadius: "20px",
            fontSize: "0.8rem",
            fontWeight: "600",
            backdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {status}
        </div>
      </div>

      {/* Hidden Canvas for capturing frames */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <button
        onClick={() => setActive(!active)}
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "1rem",
          borderRadius: "12px",
          border: "none",
          background: active ? "#ff3366" : "#00ffc4",
          color: "#000",
          fontWeight: "700",
          fontSize: "1.1rem",
          cursor: "pointer",
          boxShadow: active ? "0 4px 15px rgba(255, 51, 102, 0.4)" : "0 4px 15px rgba(0, 255, 196, 0.4)",
          transition: "all 0.3s ease",
        }}
      >
        {active ? "Stop Friday Eye" : "Activate Friday Eye"}
      </button>

      {answer && (
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            padding: "1.2rem",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "0.4rem" }}>LATEST OBSERVATION</div>
          <p style={{ margin: 0, lineHeight: "1.5", fontSize: "1.05rem" }}>{answer}</p>
        </div>
      )}

      <footer style={{ marginTop: "2rem", opacity: 0.5, fontSize: "0.8rem" }}>
        © Sahil | Multimodal Visual Assistant
      </footer>
    </div>
  );
}
