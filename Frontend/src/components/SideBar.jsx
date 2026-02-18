import React from "react";

const Sidebar = ({ sessions, currentSessionId, onSelectSession, onNewChat, isOpen }) => {
  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      width: 260,
      height: "100vh",
      background: "rgba(6,11,20,0.97)",
      borderRight: "1px solid rgba(14,165,233,0.12)",
      display: "flex",
      flexDirection: "column",
      backdropFilter: "blur(20px)",
      flexShrink: 0,
      animation: "slideInLeft 0.25s ease-out",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 14px",
        borderBottom: "1px solid rgba(14,165,233,0.1)",
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#38bdf8",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 12,
        }}>
          Chat History
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          style={{
            width: "100%",
            padding: "9px 14px",
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.1))",
            border: "1px solid rgba(14,165,233,0.3)",
            color: "#38bdf8",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(2,132,199,0.2))";
            e.currentTarget.style.boxShadow = "0 0 16px rgba(14,165,233,0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.1))";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <span style={{ fontSize: 16 }}>+</span>
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "30px 16px" }}>
            No previous chats yet.
            <br />Start a conversation!
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s._id === currentSessionId;
            return (
              <button
                key={s._id}
                onClick={() => onSelectSession(s._id)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  marginBottom: 4,
                  background: isActive
                    ? "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(2,132,199,0.15))"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(14,165,233,0.35)"
                    : "1px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.border = "1px solid rgba(14,165,233,0.15)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.border = "1px solid transparent";
                  }
                }}
              >
                <div style={{
                  color: isActive ? "#e2e8f0" : "#94a3b8",
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 4,
                }}>
                  {s.lastMessage.length > 34
                    ? s.lastMessage.substring(0, 34) + "..."
                    : s.lastMessage}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#475569", fontSize: 11 }}>
                    {s.messageCount} messages
                  </span>
                  <span style={{ color: "#475569", fontSize: 11 }}>
                    {formatTime(s.lastTime)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(14,165,233,0.1)",
        color: "#334155",
        fontSize: 11,
        textAlign: "center",
      }}>
        
      </div>
    </div>
  );
};

export default Sidebar;