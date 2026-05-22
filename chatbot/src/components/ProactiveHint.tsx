"use client";
import { useState, useEffect } from "react";

interface ProactiveHintProps {
  onOpen: () => void;
}

const PAGE_HINTS: Record<string, string> = {
  "/": "Not sure where to start? I can guide you.",
  "/services": "Need help choosing the right service?",
  "/contact": "Skip the form. Talk to me directly.",
  "/pricing": "Want help picking the right plan?",
  "/about": "Want to know how we can help your business?",
};

const DEFAULT_HINT = "Have a question? I'm here to help.";

export default function ProactiveHint({ onOpen }: ProactiveHintProps) {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("mwu_hint_shown");
    if (alreadyShown) return;

    const path = window.location.pathname;
    const message = PAGE_HINTS[path] || DEFAULT_HINT;
    setHint(message);

    const showTimer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem("mwu_hint_shown", "true");

      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 8000);

      return () => clearTimeout(hideTimer);
    }, 4000);

    return () => clearTimeout(showTimer);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: "96px", right: "86px", zIndex: 9996,
      display: "flex", alignItems: "center",
      animation: "hintSlideIn 0.4s ease-out",
      fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,Arial,sans-serif"
    }}>
      <div
        onClick={() => { setVisible(false); onOpen(); }}
        style={{
          background: "#1a1a2e",
          border: "1px solid rgba(124,58,237,0.4)",
          borderRadius: "12px 12px 0 15px",
          padding: "10px 14px", cursor: "pointer", maxWidth: "220px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          
        }}
      >
        <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.9)", lineHeight: 1.5, fontFamily: "inherit" }}>
          {hint}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8b5cf6", fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,Arial,sans-serif"}}>
          Tap to chat
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setVisible(false); }}
        style={{
          position: "absolute", top: "-8px", right: "-8px",
          width: "20px", height: "20px", borderRadius: "50%",
          background: "#16213e", border: "1px solid rgba(124,58,237,0.3)",
          color: "rgba(255,255,255,0.6)", fontSize: "11px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
        }}
      >✕</button>
      <style>{`
        @keyframes hintSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
