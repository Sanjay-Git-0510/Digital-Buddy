import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

// ─── Fetch chat history for a session ─────────────────────────────────────────
export const fetchMessages = (sessionId) =>
  axios.get(`${API_BASE}/messages/${sessionId}`);

// ─── Fetch all past sessions ───────────────────────────────────────────────────
export const fetchSessions = () =>
  axios.get(`${API_BASE}/sessions`);

// ─── Send message and get AI reply ────────────────────────────────────────────
export const sendMessage = (sessionId, userMessage) =>
  axios.post(`${API_BASE}/chat`, { sessionId, userMessage });

// ─── Clear all messages in a session ──────────────────────────────────────────
export const clearSession = (sessionId) =>
  axios.delete(`${API_BASE}/messages/${sessionId}`);