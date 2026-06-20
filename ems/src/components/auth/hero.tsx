"use client";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

export function HeroSection() {
  return (
    <div
      style={{
        background: "var(--bg-dark)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: "100%",
        overflow: "hidden",
      }}
    >
      {/* Top logo bar */}
      <div 
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: "clamp(24px, 4vw, 48px)",
          paddingRight: "clamp(24px, 4vw, 48px)",
          paddingTop: "clamp(24px, 4vw, 48px)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-inverse)", letterSpacing: "-0.08em", textTransform: "uppercase" }}>
          makewithus
        </div>
      </div>

      {/* Centered hero content */}
      <div 
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          paddingLeft: "clamp(24px, 4vw, 48px)",
          paddingRight: "clamp(24px, 4vw, 48px)",
          paddingTop: "clamp(20px, 3vw, 40px)",
          paddingBottom: "clamp(20px, 3vw, 40px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <h1
            style={{
              fontFamily: "'Helvetica', Arial, sans-serif",
              fontSize: "clamp(48px, 6vw, 84px)",
              lineHeight: 0.95,
              fontWeight: 800,
              color: "var(--text-inverse)",
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            Employee<br />
            Management<br />
            <span style={{ color: "var(--brand-red)" }}>System</span>
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "clamp(14px, 1.2vw, 16px)",
              lineHeight: 1.5,
              fontWeight: 400,
              marginTop: 40,
              maxWidth: 420,
              letterSpacing: "-0.01em",
            }}
          >
            Streamline workforce operations, track attendance, manage payroll, store
            documents, and simplify HR workflows — all in one place.
          </p>

          {/* Stat blocks - Brutalist */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginTop: 48, border: "1px solid var(--border-strong)", width: "fit-content" }}>
            {[
              { label: "Core Modules", value: "10+" },
              { label: "System Access", value: "24/7" },
              { label: "Secure Access", value: "99.9%" },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "16px 24px",
                  background: "transparent",
                  borderRight: i !== 2 ? "1px solid var(--border-strong)" : "none",
                  minWidth: 100,
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-inverse)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                  {s.value}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid var(--border-strong)",
          paddingTop: 24,
          paddingBottom: "clamp(24px, 3vw, 40px)",
          paddingLeft: "clamp(24px, 4vw, 48px)",
          paddingRight: "clamp(24px, 4vw, 48px)",
        }}
      >
        <p style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em", fontWeight: 500 }}>
          CENTRALIZED · SECURE · OPERATIONAL
        </p>
      </div>
    </div>
  );
}

export function SplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
      className="split-layout"
    >
      {/* Left — hero, hidden on mobile */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
        className="w-full md:w-[55%] hidden md:flex"
      >
        <HeroSection />
      </div>
      {/* Right — sticky, never scrolls */}
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          padding: "clamp(16px, 4vw, 48px)",
          position: "relative",
          overflow: "hidden",
        }}
        className="w-full md:w-[45%]"
      >
        <div style={{ position: "absolute", bottom: -50, right: -50, opacity: 0.03, pointerEvents: "none" }}>
          <Building2 size={400} />
        </div>
        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
