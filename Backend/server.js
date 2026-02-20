const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intelligent, friendly, and helpful AI assistant.
Provide clear, accurate, and concise responses.
You are knowledgeable across science, technology, history, arts, and general knowledge.
When you don't know something, admit it honestly.
Use a warm, conversational tone while remaining professional.
Format responses with markdown when helpful (bullet points, bold, code blocks).
Always be helpful, harmless, and honest.`;

// ─── Token Limits ──────────────────────────────────────────────────────────────
const TOKEN_LIMITS = {
  INPUT_CONTEXT: 8000,
  OUTPUT_RESPONSE: 3500,
  MAX_HISTORY_MESSAGES: 10,
};

const estimateTokens = (text) => Math.ceil(text.length / 4);

// ─── POST: Send message & get Gemini response ──────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ success: false, error: "userMessage is required" });
  }

  try {
    console.log(`📨 Received: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`);

    // Build Gemini request (no history, just system prompt + current message)
    const geminiContents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nBegin the conversation now." }] },
      { role: "model", parts: [{ text: "Understood! I'm your AI assistant. How can I help you today?" }] },
      { role: "user", parts: [{ text: userMessage }] },
    ];

    // Call Gemini API
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: geminiContents,
        generationConfig: {
          maxOutputTokens: TOKEN_LIMITS.OUTPUT_RESPONSE,
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const aiText =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response.";

    const outputTokens = estimateTokens(aiText);
    console.log(` Response: ~${outputTokens} tokens`);

    res.json({ success: true, reply: aiText });
  } catch (err) {
    console.error(" Error:", err?.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to get AI response" });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});