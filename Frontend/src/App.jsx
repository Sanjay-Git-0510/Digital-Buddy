import React, { useState, useEffect, useRef, useCallback } from "react";
import BotAvatar from "./components/BotAvatar";
import ChatMessage from "./components/ChatMessage";
import InputBar from "./components/InputBar";
import Sidebar from "./components/SideBar";
import { fetchMessages, fetchSessions, sendMessage, clearSession } from "./api";

// ─── Suggestion Prompts ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: "✨", text: "Tell me a fun science fact" },
  { icon: "🔍", text: "Explain quantum computing simply" },
  { icon: "💡", text: "Give me a creative business idea" },
  { icon: "🌍", text: "Say hello in 5 different languages" },
  { icon: "🎨", text: "Describe a futuristic city" },
  { icon: "🤔", text: "What is the meaning of life?" },
];

// ─── Floating Particles ────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 10 + 5,
  delay: Math.random() * 6,
  color: Math.random() > 0.5 ? "#0ea5e9" : "#38bdf8",
}));

// ─── Session helpers ───────────────────────────────────────────────────────────
const createSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

const getStoredSessionId = () => {
  try {
    let id = localStorage.getItem("nova_session_id");
    if (!id) {
      id = createSessionId();
      localStorage.setItem("nova_session_id", id);
    }
    return id;
  } catch {
    return createSessionId();
  }
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [sessionId, setSessionId] = useState(getStoredSessionId);
  const [messages, setMessages]   = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping]   = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError]         = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // ─── Load history ────────────────────────────────────────────────────────────
  const loadHistory = useCallback(async (sid) => {
    try {
      const res = await fetchMessages(sid);
      if (res.data.success) setMessages(res.data.messages);
    } catch {
      // Backend not connected — start fresh
      setMessages([]);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetchSessions();
      if (res.data.success) setSessions(res.data.sessions);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    loadHistory(sessionId);
    loadSessions();
  }, [sessionId, loadHistory, loadSessions]);

  // ─── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ─── Input change: track typing ──────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
    clearTimeout(typingTimerRef.current);
    if (e.target.value.length > 0) {
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 1500);
    }
  };

  // ─── Send message ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setError(null);
    setInput("");
    setIsTyping(false);

    // Optimistic UI
    const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await sendMessage(sessionId, text);
      if (res.data.success) {
        const botMsg = { role: "assistant", content: res.data.reply, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, botMsg]);
        loadSessions(); // Refresh sidebar
      }
    } catch (err) {
      setError("⚠️ Could not reach the server. Make sure your backend is running on port 5000.");
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting to the server. Please check that the backend is running.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId, loadSessions]);

  // ─── Clear chat ───────────────────────────────────────────────────────────────
  const handleClear = async () => {
    try {
      await clearSession(sessionId);
    } catch {}
    setMessages([]);
  };

  // ─── New chat ─────────────────────────────────────────────────────────────────
  const handleNewChat = () => {
    const newId = createSessionId();
    try { localStorage.setItem("nova_session_id", newId); } catch {}
    setSessionId(newId);
    setMessages([]);
    setShowSidebar(false);
  };

  // ─── Select session from sidebar ─────────────────────────────────────────────
  const handleSelectSession = (sid) => {
    try { localStorage.setItem("nova_session_id", sid); } catch {}
    setSessionId(sid);
    setShowSidebar(false);
  };

  // ─── Use suggestion prompt ────────────────────────────────────────────────────
  const handleSuggestion = (text) => {
    setInput(text);
    setIsTyping(true);
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#060b14", overflow: "hidden", position: "relative" }}>

      {/* ── Floating background particles ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {PARTICLES.map((p) => (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: 0.25,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }} />
        ))}
        {/* Glow orbs */}
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)", top:-150, left:-100 }} />
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)", bottom:-100, right:-80 }} />
        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(2,132,199,0.07) 0%, transparent 70%)", top:"40%", right:"20%" }} />
      </div>

      {/* ── Sidebar ── */}
      <Sidebar
        sessions={sessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        isOpen={showSidebar}
      />

      {/* ── Main Chat Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 1, minWidth: 0 }}>

        {/* ── Header ── */}
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "rgba(6,11,20,0.85)",
          borderBottom: "1px solid rgba(14,165,233,0.12)",
          backdropFilter: "blur(20px)",
          flexShrink: 0,
        }}>
          {/* Left: menu + bot info */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Hamburger */}
            <button
              onClick={() => setShowSidebar((s) => !s)}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#38bdf8", fontSize:20, padding:4, display:"flex", alignItems:"center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Compact bot avatar */}
            <BotAvatar size={42} isTyping={isTyping} isThinking={isLoading} />

            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>
                Nova AI
              </div>
              <div style={{ color: "#475569", fontSize: 12 }}>
                Powered by Gemini · {messages.length} message{messages.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Right: Clear button */}
          {!isEmpty && (
            <button
              onClick={handleClear}
              style={{
                padding: "7px 14px",
                borderRadius: 9,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
            >
              <span>🗑</span> Clear
            </button>
          )}
        </header>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            padding: "10px 20px",
            background: "rgba(239,68,68,0.1)",
            borderBottom: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            {error}
            <button onClick={() => setError(null)} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        )}

        {/* ── Messages Area ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column" }}>

          {/* Empty state */}
          {isEmpty && (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 28,
              animation: "fadeIn 0.5s ease",
            }}>
              {/* Large animated bot */}
              <BotAvatar size={100} isTyping={isTyping} isThinking={isLoading} />

              <div style={{ textAlign: "center" }}>
                <h1 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>
                  Hi, I'm Nova! 👋
                </h1>
                <p style={{ color: "#475569", fontSize: 15, maxWidth: 380, lineHeight: 1.6 }}>
                  Your intelligent AI assistant powered by Gemini. Ask me anything — I'm here to help!
                </p>
              </div>

              {/* Suggestion chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 520 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleSuggestion(s.text)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 20,
                      background: "rgba(14,165,233,0.08)",
                      border: "1px solid rgba(14,165,233,0.2)",
                      color: "#7dd3fc",
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(14,165,233,0.16)";
                      e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)";
                      e.currentTarget.style.boxShadow = "0 0 14px rgba(14,165,233,0.15)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(14,165,233,0.08)";
                      e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span>{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
          ))}

          {/* Thinking indicator */}
          {isLoading && (
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              marginBottom: 18,
              animation: "slideInUp 0.3s ease-out",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, boxShadow: "0 0 12px rgba(14,165,233,0.5)",
                border: "1.5px solid rgba(56,189,248,0.3)",
                animation: "pulseGlow 1.5s ease-in-out infinite",
              }}>
                🤖
              </div>
              <div style={{
                padding: "12px 18px",
                borderRadius: "4px 20px 20px 20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(56,189,248,0.15)",
              }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#38bdf8",
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar ── */}
        <InputBar
          value={input}
          onChange={handleInputChange}
          onSend={handleSend}
          isLoading={isLoading}
          isTyping={isTyping}
        />
      </div>
    </div>
  );
}