"use client";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME_MS = 4 * 60 * 1000; // 4 minutes

export default function IdleTimer() {
  const { user, signOut } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const lastActive = useRef(Date.now());
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    const resetIdleTimer = () => {
      lastActive.current = Date.now();
      if (showWarning) {
        setShowWarning(false);
      }
    };

    const events = ["mousemove", "keydown", "wheel", "DOMMouseScroll", "mouseWheel", "mousedown", "touchstart", "touchmove", "MSPointerDown", "MSPointerMove"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer, { passive: true }));

    timerInterval.current = setInterval(() => {
      const idleTime = Date.now() - lastActive.current;

      if (idleTime >= IDLE_TIMEOUT_MS) {
        // Auto logout
        signOut();
        toast.info("You have been logged out due to inactivity.");
      } else if (idleTime >= WARNING_TIME_MS) {
        // Show warning
        setShowWarning(true);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [user, showWarning, signOut]);

  if (!showWarning) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999, 
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.2s ease-out"
    }}>
      <div className="card" style={{ padding: 32, maxWidth: 400, textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "inline-flex", padding: 16, borderRadius: "50%", backgroundColor: "var(--accent-amber-dim)", color: "var(--accent-amber)", marginBottom: 20 }}>
          <AlertCircle size={32} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Are you still there?</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>
          Your session will expire in less than 1 minute due to inactivity. Click below to continue working.
        </p>
        <button 
          className="btn btn-primary" 
          style={{ width: "100%" }}
          onClick={() => {
            lastActive.current = Date.now();
            setShowWarning(false);
          }}
        >
          Continue Session
        </button>
      </div>
    </div>
  );
}
