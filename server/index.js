require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.post("/api/gemini", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt missing" });

  try {
    const response = await axios.post(
      `${GEMINI_API}?key=${GEMINI_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      },
      { timeout: 15000 }
    );

    const reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No reply";

    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gemini request failed" });
  }
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
