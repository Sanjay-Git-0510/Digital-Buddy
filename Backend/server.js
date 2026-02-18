const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── MongoDB Connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ─── Message Schema ────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// ─── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intelligent, friendly, and helpful AI assistant.
Provide clear, accurate, and concise responses.
You are knowledgeable across science, technology, history, arts, and general knowledge.
When you don't know something, admit it honestly.
Use a warm, conversational tone while remaining professional.
Format responses with markdown when helpful (bullet points, bold, code blocks).
Always be helpful, harmless, and honest.`;

// ─── Token Management ──────────────────────────────────────────────────────────
// Gemini 2.0 Flash Experimental limits: 
//   - Input: 1,048,576 tokens (1M+)
//   - Output: 65,536 tokens (64K)
// 
// We use CONSERVATIVE limits for efficiency and cost optimization:
const TOKEN_LIMITS = {
  INPUT_CONTEXT: 8000,       // ~8K tokens for context (system + history + user message)
  OUTPUT_RESPONSE: 2048,     // ~2K tokens max for AI response (enough for detailed answers)
  MAX_HISTORY_MESSAGES: 10,  // Keep last 10 messages (5 exchanges) for context
};

// Estimate token count (rough approximation: 1 token ≈ 4 characters for English text)
const estimateTokens = (text) => Math.ceil(text.length / 4);

// Trim history to fit within input token budget
const trimHistoryToFit = (history, systemPromptTokens, userMessageTokens) => {
  const availableTokens = TOKEN_LIMITS.INPUT_CONTEXT - systemPromptTokens - userMessageTokens - 100; // 100 token safety buffer
  let usedTokens = 0;
  const trimmedHistory = [];

  // Add messages from most recent first, working backwards
  for (let i = history.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(history[i].content);
    if (usedTokens + msgTokens <= availableTokens) {
      trimmedHistory.unshift(history[i]); // Add to front to maintain order
      usedTokens += msgTokens;
    } else {
      break; // Stop when we hit the token limit
    }
  }

  return trimmedHistory;
};

// ─── GET: Fetch chat history ───────────────────────────────────────────────────
app.get("/api/messages/:sessionId", async (req, res) => {
  try {
    const messages = await Message.find({ sessionId: req.params.sessionId }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET: Fetch all sessions ───────────────────────────────────────────────────
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$sessionId",
          lastMessage: { $first: "$content" },
          lastTime: { $first: "$timestamp" },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastTime: -1 } },
      { $limit: 20 },
    ]);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST: Send message & get Gemini response ──────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { sessionId, userMessage } = req.body;
  if (!sessionId || !userMessage)
    return res.status(400).json({ success: false, error: "sessionId and userMessage are required" });

  try {
    // Save user message to database
    await Message.create({ sessionId, role: "user", content: userMessage });

    // Fetch recent history (limited by MAX_HISTORY_MESSAGES)
    const fullHistory = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .limit(TOKEN_LIMITS.MAX_HISTORY_MESSAGES + 1); // +1 to include current message

    // Estimate token usage
    const systemPromptTokens = estimateTokens(SYSTEM_PROMPT);
    const userMessageTokens = estimateTokens(userMessage);

    // Trim history to fit within input token budget
    const history = trimHistoryToFit(
      fullHistory.slice(0, -1), // Exclude the current message from history
      systemPromptTokens,
      userMessageTokens
    );

    // Calculate and log total input tokens for monitoring
    const historyTokens = history.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
    const totalInputTokens = systemPromptTokens + userMessageTokens + historyTokens;
    console.log(`📊 Token usage - Input: ~${totalInputTokens} / ${TOKEN_LIMITS.INPUT_CONTEXT} tokens | History: ${history.length} messages`);

    // Build Gemini API request with trimmed history
    const geminiContents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nBegin the conversation now." }] },
      { role: "model", parts: [{ text: "Understood! I'm your AI assistant. How can I help you today?" }] },
      ...history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    // Call Gemini API with token limits and optimization settings
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: geminiContents,
        generationConfig: {
          maxOutputTokens: TOKEN_LIMITS.OUTPUT_RESPONSE, // Limit to 2K tokens max
          temperature: 0.7,        // Balanced creativity (0-1, higher = more creative)
          topP: 0.95,              // Nucleus sampling - consider top 95% probability mass
          topK: 40,                // Limit sampling to top 40 tokens
          stopSequences: [],       // Optional: add stop sequences if needed
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // Extract AI response
    const aiText =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response.";

    // Log output tokens
    const outputTokens = estimateTokens(aiText);
    console.log(`📤 Response tokens: ~${outputTokens} / ${TOKEN_LIMITS.OUTPUT_RESPONSE} tokens`);

    // Save AI response to database
    await Message.create({ sessionId, role: "assistant", content: aiText });
    
    res.json({ success: true, reply: aiText });
  } catch (err) {
    console.error("❌ Gemini API error:", err?.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to get AI response" });
  }
});

// ─── DELETE: Clear session ─────────────────────────────────────────────────────
app.delete("/api/messages/:sessionId", async (req, res) => {
  try {
    await Message.deleteMany({ sessionId: req.params.sessionId });
    res.json({ success: true, message: "Session cleared" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));





    
