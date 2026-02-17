import React from "react";

const ChatMessage = ({ role, content, timestamp }) => {
  const isUser = role === "user";

  const formatTime = (ts) => {
    const d = ts ? new Date(ts) : new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Simple markdown-like renderer for bold, inline code, bullet lists
  const renderContent = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Bold: **text**
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Inline code: `code`
      line = line.replace(/`([^`]+)`/g, `<code style="background:rgba(56,189,248,0.15);padding:2px 6px;border-radius:4px;font-size:12px;font-family:monospace;color:#38bdf8;">$1</code>`);
      // Bullet
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        line = `<span style="display:inline-flex;gap:6px;"><span style="color:#38bdf8;margin-top:2px;">▸</span><span>${line.replace(/^[\s\-•]+/, "")}</span></span>`;
      }
      return (
        <div
          key={i}
          style={{ marginBottom: line.trim() === "" ? 6 : 2 }}
          dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }}
        />
      );
    });
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      alignItems: "flex-end",
      gap: 10,
      marginBottom: 18,
      animation: "slideInUp 0.3s ease-out",
    }}>
      {/* Bot avatar (left side) */}
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
          boxShadow: "0 0 12px rgba(14,165,233,0.5)",
          border: "1.5px solid rgba(56,189,248,0.3)",
        }}>
          🤖
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 4,
                    alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          padding: "12px 16px",
          borderRadius: isUser ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
          background: isUser
            ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
            : "rgba(255,255,255,0.05)",
          border: isUser
            ? "none"
            : "1px solid rgba(56,189,248,0.15)",
          color: "#f1f5f9",
          fontSize: 14,
          lineHeight: 1.65,
          boxShadow: isUser
            ? "0 4px 20px rgba(14,165,233,0.35)"
            : "0 2px 12px rgba(0,0,0,0.3)",
          wordBreak: "break-word",
          backdropFilter: isUser ? "none" : "blur(8px)",
        }}>
          {renderContent(content)}
        </div>
        <span style={{ fontSize: 11, color: "rgba(148,163,184,0.5)", padding: "0 4px" }}>
          {formatTime(timestamp)}
        </span>
      </div>

      {/* User avatar (right side) */}
      {isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
          boxShadow: "0 0 10px rgba(245,158,11,0.4)",
        }}>
          👤
        </div>
      )}
    </div>
  );
};

export default ChatMessage;