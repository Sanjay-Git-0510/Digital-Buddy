import React, { useRef, useEffect } from "react";

const InputBar = ({ value, onChange, onSend, isLoading, isTyping }) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim() && !isLoading;

  return (
    <div style={{ padding: "14px 20px 20px", background: "rgba(6,11,20,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(14,165,233,0.1)" }}>
      {/* Glow border wrapper */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        background: "rgba(255,255,255,0.03)",
        border: `1.5px solid ${isTyping ? "rgba(56,189,248,0.6)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        padding: "10px 14px",
        boxShadow: isTyping
          ? "0 0 24px rgba(14,165,233,0.2), inset 0 0 20px rgba(14,165,233,0.04)"
          : "none",
        transition: "all 0.3s ease",
      }}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Nova..."
          rows={1}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            resize: "none",
            color: "#e2e8f0",
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: "inherit",
            maxHeight: 120,
            overflowY: "auto",
            caretColor: "#38bdf8",
          }}
        />

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={!canSend}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "none",
            background: canSend
              ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
              : "rgba(255,255,255,0.05)",
            color: canSend ? "#fff" : "#334155",
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            flexShrink: 0,
            transition: "all 0.25s ease",
            boxShadow: canSend ? "0 4px 16px rgba(14,165,233,0.45)" : "none",
            transform: canSend ? "scale(1)" : "scale(0.95)",
          }}
          onMouseOver={(e) => {
            if (canSend) e.currentTarget.style.transform = "scale(1.08)";
          }}
          onMouseOut={(e) => {
            if (canSend) e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {isLoading ? (
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              animation: "spin 0.7s linear infinite",
            }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Hint */}
      <div style={{ textAlign: "center", color: "#1e293b", fontSize: 11, marginTop: 8 }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
};

export default InputBar;