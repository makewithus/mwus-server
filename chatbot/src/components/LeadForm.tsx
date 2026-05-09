"use client";
import { useState } from "react";

interface LeadFormProps {
  whatsappNumber: string;
  onSuccess: (name: string) => void;
  onDismiss: () => void;
  prefillNeed?: string;
}

const C = {
  surface: "#16213e", input: "#0d0d1f", white: "#ffffff",
  text: "rgba(255,255,255,0.88)", muted: "rgba(255,255,255,0.55)",
  border: "rgba(124,58,237,0.25)", accent: "#7c3aed", wa: "#25D366",
};

function buildURL(number: string, name: string, phone: string, need: string): string {
  const text = `Hi! I'm ${name}. I'm interested in: ${need || "your services"}. My number is ${phone}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export default function LeadForm({ whatsappNumber, onSuccess, onDismiss, prefillNeed = "" }: LeadFormProps) {
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [need,  setNeed]  = useState(prefillNeed);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!phone.trim()) { setError("Please enter your phone number."); return; }
    const digits = phone.replace(/[\s\-()]/g, "");
    if (digits.length < 7) { setError("Please enter a valid phone number."); return; }
    window.open(buildURL(whatsappNumber, name.trim(), phone.trim(), need.trim()), "_blank", "noopener noreferrer");
    onSuccess(name.trim());
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", background: C.input,
    border: `1px solid ${C.border}`, borderRadius: "8px", color: C.white,
    fontSize: "13px", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", marginBottom: "8px", transition: "border-color 0.15s",
  };

  return (
    <div style={{ background: C.surface, border: "1px solid rgba(124,58,237,0.4)", borderRadius: "14px", padding: "16px", marginTop: "8px" }}>
      <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 500, color: C.white }}>Let's get you started</p>
      <p style={{ margin: "0 0 12px", fontSize: "12px", color: C.muted }}>Fill this and we'll open WhatsApp for you.</p>

      <input type="text" placeholder="Your name *" value={name} onChange={e => setName(e.target.value)}
        onFocus={e => (e.currentTarget.style.borderColor = "#8b5cf6")}
        onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
        style={inputStyle} />

      <input type="tel" placeholder="Phone number * (e.g. 9876543210)" value={phone} onChange={e => setPhone(e.target.value)}
        onFocus={e => (e.currentTarget.style.borderColor = "#8b5cf6")}
        onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
        style={inputStyle} />

      <input type="text" placeholder="What do you need? (e.g. a business website)" value={need} onChange={e => setNeed(e.target.value)}
        onFocus={e => (e.currentTarget.style.borderColor = "#8b5cf6")}
        onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
        style={{ ...inputStyle, marginBottom: "12px" }} />

      {error && (
        <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)" }}>
          ⚠️ {error}
        </p>
      )}

      <button onClick={handleSubmit}
        style={{ width: "100%", padding: "10px", background: C.wa, border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Open WhatsApp
      </button>

      <button onClick={onDismiss}
        style={{ background: "none", border: "none", color: C.muted, fontSize: "11px", cursor: "pointer", marginTop: "8px", display: "block", width: "100%", textAlign: "center", fontFamily: "inherit" }}
        onMouseEnter={e => (e.currentTarget.style.color = C.text)}
        onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
        Maybe later
      </button>
    </div>
  );
}
