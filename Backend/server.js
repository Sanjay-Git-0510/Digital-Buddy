const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-Memory Storage Only ───────────────────────────────────────────────────
// WARNING: All data lost on server restart AND page refresh!
let messagesStore = {}; // { sessionId: [messages] }

// ─── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intelligent, friendly, and helpful AI assistant.
Provide clear, accurate, and concise responses.
You are knowledgeable across science, technology, history, arts, and general knowledge.
When you don't know something, admit it honestly.
Use a warm, conversational tone while remaining professional.
Format responses with markdown when helpful (bullet points, bold, code blocks).
Always be helpful, harmless, and honest.`;

// ─── Token Management ──────────────────────────────────────────────────────────
const TOKEN_LIMITS = {
  INPUT_CONTEXT: 8000,
  OUTPUT_RESPONSE: 3500,
  MAX_HISTORY_MESSAGES: 10,
};

const estimateTokens = (text) => Math.ceil(text.length / 4);

const trimHistoryToFit = (history, systemPromptTokens, userMessageTokens) => {
  const availableTokens = TOKEN_LIMITS.INPUT_CONTEXT - systemPromptTokens - userMessageTokens - 100;
  let usedTokens = 0;
  const trimmedHistory = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(history[i].content);
    if (usedTokens + msgTokens <= availableTokens) {
      trimmedHistory.unshift(history[i]);
      usedTokens += msgTokens;
    } else {
      break;
    }
  }

  return trimmedHistory;
};

// ─── GET: Fetch chat history ───────────────────────────────────────────────────
app.get("/api/messages/:sessionId", async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const messages = messagesStore[sessionId] || [];
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET: Fetch all sessions ───────────────────────────────────────────────────
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = Object.keys(messagesStore)
      .map((sessionId) => {
        const messages = messagesStore[sessionId];
        const lastMessage = messages[messages.length - 1];
        return {
          _id: sessionId,
          lastMessage: lastMessage?.content?.substring(0, 50) || "New chat",
          lastTime: lastMessage?.timestamp || new Date(),
          messageCount: messages.length,
        };
      })
      .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
      .slice(0, 20);

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST: Send message & get Gemini response ──────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { sessionId, userMessage } = req.body;

  if (!sessionId || !userMessage) {
    return res.status(400).json({ success: false, error: "sessionId and userMessage are required" });
  }

  try {
    // Initialize session if needed
    if (!messagesStore[sessionId]) {
      messagesStore[sessionId] = [];
    }

    // Save user message
    const userMsg = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    messagesStore[sessionId].push(userMsg);

    // Get history
    const fullHistory = messagesStore[sessionId].slice(-TOKEN_LIMITS.MAX_HISTORY_MESSAGES);

    // Estimate tokens
    const systemPromptTokens = estimateTokens(SYSTEM_PROMPT);
    const userMessageTokens = estimateTokens(userMessage);

    // Trim history
    const history = trimHistoryToFit(
      fullHistory.slice(0, -1),
      systemPromptTokens,
      userMessageTokens
    );

    const historyTokens = history.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
    const totalInputTokens = systemPromptTokens + userMessageTokens + historyTokens;
    console.log(`📊 Input: ~${totalInputTokens}/${TOKEN_LIMITS.INPUT_CONTEXT} tokens | History: ${history.length} msgs`);

    // Build Gemini request
    const geminiContents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nBegin the conversation now." }] },
      { role: "model", parts: [{ text: "Understood! I'm your AI assistant. How can I help you today?" }] },
      ...history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    // Call Gemini
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

    console.log(`📤 Output: ~${estimateTokens(aiText)}/${TOKEN_LIMITS.OUTPUT_RESPONSE} tokens`);

    // Save AI response
    const aiMsg = {
      role: "assistant",
      content: aiText,
      timestamp: new Date().toISOString(),
    };
    messagesStore[sessionId].push(aiMsg);

    res.json({ success: true, reply: aiText });
  } catch (err) {
    console.error("❌ Error:", err?.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to get AI response" });
  }
});

// ─── DELETE: Clear session ─────────────────────────────────────────────────────
app.delete("/api/messages/:sessionId", async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const deletedCount = messagesStore[sessionId]?.length || 0;
    delete messagesStore[sessionId];
    res.json({ success: true, message: "Session cleared", deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`${"=".repeat(50)}\n`);
});