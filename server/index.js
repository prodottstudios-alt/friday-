require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_KEY = process.env.GEMINI_API_KEY;

let latestSpeech = {
  id: null,
  text: "",
  timestamp: 0
};

app.post("/api/upload-frame", async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Image data missing" });

  try {
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "");

    const prompt = 
      "You are Friday, Sahil's highly advanced AI assistant. Sahil is looking at you through his phone camera. " +
      "Analyze this camera frame. Describe what Sahil boss is doing, his expression, or his workspace in a friendly, conversational Hinglish tone, under 2 sentences. " +
      "Keep it highly speech-friendly (no formatting, no markdown, no special characters, no symbols). " +
      "If the frame is completely empty or black, reply with exactly '[NO_OUTPUT]'.";

    const response = await axios.post(
      `${GEMINI_API}?key=${GEMINI_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ]
      },
      { timeout: 15000 }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (reply && reply !== "[NO_OUTPUT]" && !reply.includes("[NO_OUTPUT]")) {
      latestSpeech = {
        id: Math.random().toString(36).substring(7),
        text: reply,
        timestamp: Date.now()
      };
      console.log(`🎙️ New speech event: "${reply}"`);
    }

    res.json({ success: true, reply });
  } catch (e) {
    console.error("Gemini upload-frame error:", e?.response?.data || e.message);
    res.status(500).json({ error: "Failed to process image frame" });
  }
});

app.get("/api/latest-speech", (req, res) => {
  res.json(latestSpeech);
});

// Serve the React build in production
const path = require("path");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "dist")));
  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"))
  );
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
