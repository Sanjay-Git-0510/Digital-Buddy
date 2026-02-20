import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "https://digital-buddy.onrender.com/api";

// ─── Send message and get AI reply ────────────────────────────────────────────
export const sendMessage = (userMessage) =>
  axios.post(`${API_BASE}/chat`, { userMessage });