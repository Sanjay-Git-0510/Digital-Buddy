import React from "react";

/**
 * BotAvatar — Dynamic animated chatbot mascot.
 * When isTyping=true it goes "excited" mode with wild movement.
 * When isThinking=true it pulses with a loading shimmer.
 * Default mode is a calm idle float.
 */
const BotAvatar = ({ size = 48, isTyping = false, isThinking = false, style = {} }) => {
  const getAnimation = () => {
    // Always use calm idle animation - no shaking when typing
    return "botIdle 3s ease-in-out infinite";
  };

  const getGlow = () => {
    if (isTyping)   return "0 0 24px rgba(56,189,248,0.8), 0 0 48px rgba(14,165,233,0.4)";
    if (isThinking) return "0 0 20px rgba(14,165,233,0.6), 0 0 40px rgba(14,165,233,0.3)";
    return "0 0 12px rgba(14,165,233,0.4)";
  };

  const getStatusColor = () => {
    if (isTyping)   return "#f59e0b";
    if (isThinking) return "#a78bfa";
    return "#10b981";
  };

  const getStatusLabel = () => {
    if (isTyping)   return "Buddy is typing...";
    if (isThinking) return "Thinking...";
    return "Online";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, ...style }}>
      {/* Outer ripple ring (only while typing) */}
      <div style={{ position: "relative", width: size, height: size }}>
        {isTyping && (
          <>
            <div style={{
              position: "absolute", inset: -8,
              borderRadius: "50%",
              border: "2px solid rgba(56,189,248,0.5)",
              animation: "ripple 1s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: -4,
              borderRadius: "50%",
              border: "2px solid rgba(56,189,248,0.3)",
              animation: "ripple 1s ease-out 0.3s infinite",
            }} />
          </>
        )}

        {/* Avatar circle */}
        <div style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 40%, #0284c7 70%, #0369a1 100%)",
          backgroundSize: "200% 200%",
          animation: `gradientShift 3s ease infinite, ${getAnimation()}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.42,
          boxShadow: getGlow(),
          transition: "box-shadow 0.4s ease",
          cursor: "default",
          userSelect: "none",
          border: "2px solid rgba(56,189,248,0.3)",
        }}>
          🤖
        </div>

        {/* Status indicator dot */}
        <div style={{
          position: "absolute",
          bottom: 2,
          right: 2,
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: "50%",
          background: getStatusColor(),
          border: `2px solid #060b14`,
          transition: "background 0.4s ease",
          animation: (isTyping || isThinking) ? "statusPulse 0.8s ease-in-out infinite" : "none",
          boxShadow: `0 0 8px ${getStatusColor()}`,
        }} />
      </div>

      {/* Status label */}
      <span style={{
        fontSize: 11,
        fontWeight: 500,
        color: getStatusColor(),
        transition: "color 0.3s ease",
        letterSpacing: "0.02em",
        animation: isTyping ? "fadeIn 0.2s ease" : "none",
      }}>
        {getStatusLabel()}
      </span>
    </div>
  );
};

export default BotAvatar;