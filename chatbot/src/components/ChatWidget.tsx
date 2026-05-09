// "use client";
// import { useState, useEffect, useRef } from "react";
// import ProactiveHint from "./ProactiveHint";
// import LeadForm from "./LeadForm";

// interface Message { role: "user" | "assistant"; content: string; }
// type Screen = "home" | "chat" | "voice" | "call";

// const WHATSAPP_NUMBER = "916395428620";
// const PHONE_NUMBER    = "+91 63954 28620";
// const PHONE_DIALABLE  = "916395428620";
// const WHATSAPP_BASE   = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I found you through MakeWithUs and I'd like to know more.")}`;
// const F               = "'Inter','Segoe UI',system-ui,-apple-system,Arial,sans-serif";

// const C = {
//   bg:      "#1a1a2e",
//   surface: "#16213e",
//   header:  "#12122a",
//   input:   "#0d0d1f",
//   accent:  "#7c3aed",
//   accentL: "#8b5cf6",
//   white:   "#ffffff",
//   text:    "rgba(255,255,255,0.88)",
//   muted:   "rgba(255,255,255,0.55)",
//   border:  "rgba(124,58,237,0.25)",
//   wa:      "#25D366",
// };

// const PAGE_SESSION = Math.random().toString(36).slice(2);

// declare global {
//   interface Window {
//     SpeechRecognition: new () => SpeechRecognition;
//     webkitSpeechRecognition: new () => SpeechRecognition;
//   }
// }

// const WaIcon = ({ size = 14 }: { size?: number }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
//     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
//   </svg>
// );

// export default function ChatWidget() {

//   const [isOpen,       setIsOpen]       = useState(false);
//   const [screen,       setScreen]       = useState<Screen>("home");
//   const [messages,     setMessages]     = useState<Message[]>([]);
//   const [input,        setInput]        = useState("");
//   const [isSending,    setIsSending]    = useState(false);
//   const [isTyping,     setIsTyping]     = useState(false);
//   const [isListening,  setIsListening]  = useState(false);
//   const [isSpeaking,   setIsSpeaking]   = useState(false);
//   const [voiceOk,      setVoiceOk]      = useState(false);
//   const [isMuted,      setIsMuted]      = useState(false);
//   const [voiceStatus,  setVoiceStatus]  = useState("Tap the mic to speak");
//   const [callDuration, setCallDuration] = useState(0);
//   const [showLead,     setShowLead]     = useState(false);
//   const [leadSent,     setLeadSent]     = useState(false);
//   const [lastUserMsg,  setLastUserMsg]  = useState("");

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const inputRef       = useRef<HTMLInputElement>(null);
//   const recognitionRef = useRef<SpeechRecognition | null>(null);
//   const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);

//   const screenRef     = useRef<Screen>("home");
//   const isMutedRef    = useRef(false);
//   const isSpeakingRef = useRef(false);
//   const isSendingRef  = useRef(false);
//   const messagesRef   = useRef<Message[]>([]);

//   useEffect(() => { screenRef.current    = screen;    }, [screen]);
//   useEffect(() => { isMutedRef.current   = isMuted;   }, [isMuted]);
//   useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
//   useEffect(() => { isSendingRef.current  = isSending;  }, [isSending]);
//   useEffect(() => { messagesRef.current   = messages;   }, [messages]);

//   // ── Browser capability check ───────────────────────────────────────────────
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if (window.SpeechRecognition || window.webkitSpeechRecognition) setVoiceOk(true);
//     if (window.speechSynthesis) {
//       window.speechSynthesis.getVoices();
//       window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
//     }
//   }, []);

//   // ── Session management ─────────────────────────────────────────────────────
//   useEffect(() => {
//     const last = sessionStorage.getItem("mwu_session");
//     if (last !== PAGE_SESSION) {
//       sessionStorage.setItem("mwu_session", PAGE_SESSION);
//       sessionStorage.removeItem("mwu_msgs");
//       setMessages([]);
//     } else {
//       try { const s = sessionStorage.getItem("mwu_msgs"); if (s) setMessages(JSON.parse(s)); }
//       catch { setMessages([]); }
//     }
//   }, []);

//   useEffect(() => {
//     if (messages.length > 0) sessionStorage.setItem("mwu_msgs", JSON.stringify(messages));
//   }, [messages]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isTyping, showLead]);

//   useEffect(() => {
//     if (isOpen && screen === "chat") setTimeout(() => inputRef.current?.focus(), 150);
//   }, [isOpen, screen]);

//   // Cleanup when leaving voice screen
//   useEffect(() => {
//     if (screen !== "voice") {
//       stopListening();
//       stopSpeakingNow();
//       if (timerRef.current) clearInterval(timerRef.current);
//       setCallDuration(0);
//       setVoiceStatus("Tap the mic to speak");
//       setIsSpeaking(false);
//     }
//   }, [screen]);

//   // ── TTS: stop immediately ──────────────────────────────────────────────────
//   function stopSpeakingNow() {
//     try {
//       if (typeof window !== "undefined" && window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//     } catch { /* ignore */ }
//     setIsSpeaking(false);
//     isSpeakingRef.current = false;
//   }

//   // ── TTS: speak text ────────────────────────────────────────────────────────
//   // FIX: All TTS errors (interrupted, canceled, synthesis-failed, etc.) are
//   //      suppressed silently — never logged — so Next.js never shows TTS error: {}
//   function speakText(text: string) {
//     if (typeof window === "undefined") return;
//     if (!window.speechSynthesis)       return;
//     if (isMutedRef.current)            return;

//     try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
//     setIsSpeaking(false);

//     setTimeout(() => {
//       if (isMutedRef.current) return;

//       let utt: SpeechSynthesisUtterance;
//       try {
//         utt = new SpeechSynthesisUtterance(text);
//       } catch {
//         return; // silently bail
//       }

//       utt.lang   = "en-US";
//       utt.rate   = 1.0;
//       utt.pitch  = 1.0;
//       utt.volume = 1.0;

//       try {
//         const voices    = window.speechSynthesis.getVoices();
//         const preferred = voices.find(v =>
//           v.lang.startsWith("en") &&
//           (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen"))
//         ) || voices.find(v => v.lang.startsWith("en") && !v.name.includes("Zira"));
//         if (preferred) utt.voice = preferred;
//       } catch { /* use default voice */ }

//       utt.onstart = () => {
//         setIsSpeaking(true);
//         isSpeakingRef.current = true;
//         setVoiceStatus("AI is speaking...");
//       };

//       utt.onend = () => {
//         setIsSpeaking(false);
//         isSpeakingRef.current = false;
//         setVoiceStatus("Tap the mic to speak");
//         if (screenRef.current === "voice" && !isMutedRef.current) {
//           setTimeout(() => {
//             if (
//               screenRef.current === "voice" &&
//               !isSpeakingRef.current &&
//               !isSendingRef.current
//             ) {
//               startListeningVoice();
//             }
//           }, 600);
//         }
//       };


//       utt.onerror = (_e: SpeechSynthesisErrorEvent) => {
//         setIsSpeaking(false);
//         isSpeakingRef.current = false;
//         setVoiceStatus("Tap the mic to speak");
//         // deliberately no console.warn / console.error here
//       };

//       try {
//         window.speechSynthesis.speak(utt);
//       } catch {
//         setIsSpeaking(false);
//         // silently bail — no console output
//       }
//     }, 150);
//   }

//   const toggleMute = () => {
//     const next = !isMuted;
//     setIsMuted(next);
//     isMutedRef.current = next;
//     if (next) stopSpeakingNow();
//   };

//   // ── Speech recognition ─────────────────────────────────────────────────────
//   function startListening(onTranscript?: (t: string) => void) {
//     if (!voiceOk) return;
//     if (isSpeakingRef.current) return;

//     try {
//       if (recognitionRef.current) {
//         recognitionRef.current.onend   = null;
//         recognitionRef.current.onerror = null;
//         recognitionRef.current.stop();
//       }
//     } catch { /* ignore */ }

//     const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
//     const rec = new SR();
//     recognitionRef.current = rec;
//     rec.lang            = "en-IN";
//     rec.interimResults  = false;
//     rec.maxAlternatives = 1;
//     rec.continuous      = false;

//     rec.onstart = () => {
//       setIsListening(true);
//       setVoiceStatus("Listening...");
//     };

//     rec.onresult = (e: SpeechRecognitionEvent) => {
//       const transcript = e.results[0][0].transcript.trim();
//       if (!transcript) return;
//       if (onTranscript) {
//         onTranscript(transcript);
//       } else {
//         setInput(prev => prev ? prev + " " + transcript : transcript);
//         setTimeout(() => inputRef.current?.focus(), 50);
//       }
//     };

//     rec.onerror = (e: SpeechRecognitionErrorEvent) => {
//       if (e.error !== "no-speech" && e.error !== "aborted") {
//         // only log actual unexpected errors, not normal ones
//         console.warn("Speech recognition:", e.error);
//       }
//       setIsListening(false);
//       setVoiceStatus("Tap the mic to speak");
//     };

//     rec.onend = () => {
//       setIsListening(false);
//       setVoiceStatus("Tap the mic to speak");
//     };

//     try { rec.start(); } catch {
//       setIsListening(false);
//     }
//   }

//   function startListeningVoice() {
//     startListening((transcript) => sendMessageVoice(transcript));
//   }

//   function stopListening() {
//     try {
//       if (recognitionRef.current) {
//         recognitionRef.current.onend   = null;
//         recognitionRef.current.onerror = null;
//         recognitionRef.current.stop();
//       }
//     } catch { /* ignore */ }
//     setIsListening(false);
//   }

//   const toggleChatMic = () => { if (isListening) stopListening(); else startListening(); };

//   const toggleVoiceMic = () => {
//     if (isListening) {
//       stopListening();
//     } else {
//       stopSpeakingNow();
//       startListeningVoice();
//     }
//   };

//   const startVoiceCall = () => {
//     setScreen("voice");
//     setCallDuration(0);
//     timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
//     setTimeout(() => speakText("Hi! I'm the MakeWithUs AI. How can I help you today?"), 800);
//   };

//   const fmt = (s: number) =>
//     `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

//   // ── API call ───────────────────────────────────────────────────────────────
//   async function callAPI(msgs: Message[]): Promise<{ reply: string; intent: string } | null> {
//     try {
//       const res  = await fetch("/api/chat", {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify({ messages: msgs }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "API error");
//       return { reply: data.reply, intent: data.intent };
//     } catch (err) {
//       console.error("API call failed:", err);
//       return null;
//     }
//   }

//   // ── Send from chat screen (no TTS) ────────────────────────────────────────
//   const sendMessage = async (text?: string) => {
//     const msg = (text ?? input).trim();
//     if (!msg || isSending) return;

//     setLastUserMsg(msg);
//     const updated = [...messages, { role: "user" as const, content: msg }];
//     setMessages(updated);
//     setInput("");
//     setIsSending(true);
//     setIsTyping(true);
//     setTimeout(() => inputRef.current?.focus(), 10);

//     const result = await callAPI(updated);
//     setIsTyping(false);
//     setIsSending(false);

//     if (!result) {
//       setMessages(p => [...p, { role: "assistant", content: "⚠️ Cannot connect. Is Ollama running?" }]);
//     } else {
//       setMessages(p => [...p, { role: "assistant", content: result.reply }]);
//       if (result.intent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
//     }
//     setTimeout(() => inputRef.current?.focus(), 50);
//   };

//   // ── Send from voice screen (with TTS) ─────────────────────────────────────
//   const sendMessageVoice = async (text: string) => {
//     const msg = text.trim();
//     if (!msg || isSendingRef.current) return;

//     stopSpeakingNow();
//     setLastUserMsg(msg);
//     setVoiceStatus("Thinking...");

//     const updated = [...messagesRef.current, { role: "user" as const, content: msg }];
//     setMessages(updated);
//     setIsSending(true);
//     setIsTyping(true);

//     const result = await callAPI(updated);
//     setIsTyping(false);
//     setIsSending(false);

//     if (!result) {
//       const errMsg = "I couldn't connect. Please make sure Ollama is running.";
//       setMessages(p => [...p, { role: "assistant", content: " " + errMsg }]);
//       speakText(errMsg);
//     } else {
//       setMessages(p => [...p, { role: "assistant", content: result.reply }]);
//       speakText(result.reply);
//       if (result.intent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
//     }
//   };

//   const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
//   };

//   const handleLeadSuccess = (name: string) => {
//     setLeadSent(true); setShowLead(false);
//     const m = `Great, ${name}! Opening WhatsApp now. Our team will reply shortly.`;
//     setMessages(p => [...p, { role: "assistant", content: m }]);
//     if (screen === "voice") speakText(m);
//   };

//   const handleLeadDismiss = () => {
//     setShowLead(false);
//     const m = "No worries! Feel free to ask me anything else.";
//     setMessages(p => [...p, { role: "assistant", content: m }]);
//     if (screen === "voice") speakText(m);
//   };

//   const clearChat = () => {
//     setMessages([]); setShowLead(false); setLeadSent(false); setLastUserMsg("");
//     sessionStorage.removeItem("mwu_msgs");
//   };

//   const openWidget  = () => { setIsOpen(true); setScreen("home"); };
//   const closeWidget = () => {
//     setIsOpen(false); stopListening(); stopSpeakingNow();
//     if (timerRef.current) clearInterval(timerRef.current);
//   };

//   const prompts = ["What services do you offer?", "Tell me about your pricing", "How do I get started?"];

//   // ── Shared header used by chat / voice / call screens ─────────────────────
//   const SharedHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
//     <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, fontFamily: F }}>
//       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//         <button
//           onClick={() => {
//             stopListening(); stopSpeakingNow();
//             if (timerRef.current) clearInterval(timerRef.current);
//             setScreen("home");
//           }}
//           style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: F, flexShrink: 0 }}>←</button>
//         <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff", flexShrink: 0 }}>✦</div>
//         <div>
//           <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "14px", fontFamily: F }}>{title}</p>
//           {subtitle && <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "11px", fontFamily: F }}>{subtitle}</p>}
//         </div>
//       </div>
//       <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
//         {screen === "voice" && (
//           <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute AI"}
//             style={{ background: isMuted ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
//             {isMuted
//               ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
//               : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
//             }
//           </button>
//         )}
//         <button onClick={closeWidget} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: F }}>✕</button>
//       </div>
//     </div>
//   );

//   // ── HOME SCREEN ────────────────────────────────────────────────────────────
//   const HomeScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "28px 20px 24px", flexShrink: 0 }}>
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//             <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff" }}>✦</div>
//             <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "16px", fontFamily: F }}>MakeWithUs AI</p>
//           </div>
//           <button onClick={closeWidget} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: F }}>✕</button>
//         </div>
//         <p style={{ margin: 0, color: "#fff", fontSize: "22px", fontWeight: 700, fontFamily: F }}>Hi there! </p>
//         <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "14px", fontFamily: F }}>Let&apos;s get you started</p>
//       </div>

//       <div style={{ flex: 1, background: C.bg, padding: "16px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
//         {[
//           {
//             label: "Start chat",
//             sub:   "Chat with our AI assistant",
//             hc:    C.accentL,
//             iBg:   "rgba(124,58,237,0.15)",
//             hide:  false,
//             onClick: () => setScreen("chat"),
//             icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
//           },
//           {
//             label: "Start voice call",
//             sub:   "Speak — AI replies by voice",
//             hc:    C.accentL,
//             iBg:   "rgba(124,58,237,0.15)",
//             hide:  !voiceOk,
//             onClick: startVoiceCall,
//             icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
//           },
//           {
//             label: "Call us",
//             sub:   "Talk to a real person",
//             hc:    C.wa,
//             iBg:   "rgba(37,211,102,0.12)",
//             hide:  false,
//             onClick: () => setScreen("call"),
//             icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.wa} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
//           },
//         ].filter(r => !r.hide).map(row => (
//           <button key={row.label} onClick={row.onClick}
//             style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", cursor: "pointer", width: "100%", fontFamily: F, transition: "border-color 0.15s" }}
//             onMouseEnter={e => (e.currentTarget.style.borderColor = row.hc)}
//             onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//             <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
//               <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: row.iBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.icon}</div>
//               <div style={{ textAlign: "left" }}>
//                 <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: F }}>{row.label}</p>
//                 <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>{row.sub}</p>
//               </div>
//             </div>
//             <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
//           </button>
//         ))}

//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
//           style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "12px", textDecoration: "none", fontFamily: F, transition: "border-color 0.15s" }}
//           onMouseEnter={e => (e.currentTarget.style.borderColor = C.wa)}
//           onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(37,211,102,0.25)")}>
//           <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
//             <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(37,211,102,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.wa }}><WaIcon size={20}/></div>
//             <div style={{ textAlign: "left" }}>
//               <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: F }}>WhatsApp us</p>
//               <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>Message us directly</p>
//             </div>
//           </div>
//           <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
//         </a>
//       </div>

//       <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── CHAT SCREEN ────────────────────────────────────────────────────────────
//   const ChatScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader title="MakeWithUs AI" subtitle={isTyping ? "Typing..." : "Online "} />

//       <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: C.bg }}>
//         {messages.length === 0 && (
//           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "11px" }}>
//             <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "#fff" }}>✦</div>
//             <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: C.white, fontFamily: F }}>Hey! How can I help you?</p>
//             <p style={{ margin: 0, fontSize: "13px", color: C.muted, textAlign: "center", lineHeight: 1.6, fontFamily: F }}>Ask about services, pricing,<br/>or how we can grow your business.</p>
//             <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%", marginTop: "4px" }}>
//               {prompts.map(p => (
//                 <button key={p} onClick={() => sendMessage(p)}
//                   style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px 14px", fontSize: "13px", cursor: "pointer", color: C.text, textAlign: "left", fontFamily: F, transition: "border-color 0.15s" }}
//                   onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
//                   onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>{p}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {messages.map((msg, i) => (
//           <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
//             {msg.role === "assistant" && (
//               <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>✦</div>
//             )}
//             <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: msg.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentL})` : C.surface, color: msg.role === "user" ? "#fff" : C.text, fontSize: "13px", lineHeight: "1.65", fontFamily: F, border: msg.role === "assistant" ? `1px solid ${C.border}` : "none", whiteSpace: "pre-wrap" }}>
//               {msg.content}
//             </div>
//           </div>
//         ))}

//         {isTyping && (
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0 }}>✦</div>
//             <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 3px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: "4px", alignItems: "center" }}>
//               {[0,1,2].map(n => <span key={n} style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}
//             </div>
//           </div>
//         )}

//         {showLead && !leadSent && (
//           <LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg}/>
//         )}
//         <div ref={messagesEndRef}/>
//       </div>

//       <div style={{ padding: "12px 14px", background: C.header, borderTop: `1px solid ${C.border}`, display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
//         {voiceOk && (
//           <button onClick={toggleChatMic}
//             style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: isListening ? "rgba(239,68,68,0.85)" : "rgba(124,58,237,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s", animation: isListening ? "mwuPulse 1.2s ease-in-out infinite" : "none" }}>
//             {isListening
//               ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
//               : <svg width="16" height="16" viewBox="0 0 24 24" fill={C.accentL}><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={C.accentL} strokeWidth="2" fill="none" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="23" x2="16" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round"/></svg>
//             }
//           </button>
//         )}
//         <input ref={inputRef} type="text" value={input}
//           onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
//           placeholder={isListening ? "🎤 Listening..." : "Ask anything..."}
//           autoComplete="off"
//           style={{ flex: 1, border: `1px solid ${isListening ? "rgba(239,68,68,0.5)" : C.border}`, borderRadius: "22px", padding: "9px 15px", fontSize: "13px", outline: "none", background: C.input, color: C.white, fontFamily: F, transition: "border-color 0.15s" }}
//           onFocus={e => (e.currentTarget.style.borderColor = C.accentL)}
//           onBlur={e  => (e.currentTarget.style.borderColor = isListening ? "rgba(239,68,68,0.5)" : C.border)}
//         />
//         <button onClick={() => sendMessage()} disabled={isSending || !input.trim()}
//           style={{ width: "36px", height: "36px", borderRadius: "50%", background: isSending || !input.trim() ? "rgba(124,58,237,0.25)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: isSending || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: "#fff", flexShrink: 0 }}>➤</button>
//       </div>

//       {isListening && (
//         <div style={{ background: "rgba(239,68,68,0.12)", borderTop: "1px solid rgba(239,68,68,0.2)", padding: "6px 14px", fontSize: "11px", color: "#f87171", textAlign: "center", flexShrink: 0, fontFamily: F }}>
//            Listening... tap mic to stop
//         </div>
//       )}

//       <div style={{ background: C.header, padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", color: C.wa, fontSize: "11px", textDecoration: "none", fontFamily: F }}><WaIcon size={12}/> WhatsApp</a>
//         <button onClick={clearChat} style={{ background: "none", border: "none", color: C.muted, fontSize: "11px", cursor: "pointer", fontFamily: F }}>Clear chat</button>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── VOICE SCREEN ───────────────────────────────────────────────────────────
//   const VoiceScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader
//         title="Voice call"
//         subtitle={isMuted ? " AI muted" : isSpeaking ? " AI speaking..." : isListening ? " Listening..." : isSending ? " Thinking..." : voiceStatus}
//       />
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "22px", padding: "28px" }}>
//         <div style={{ position: "relative" }}>
//           {(isListening || isSpeaking) && (
//             <>
//               <div style={{ position: "absolute", inset: "-16px", borderRadius: "50%", border: `2px solid ${isSpeaking ? C.accentL : "#ef4444"}`, opacity: 0.35, animation: "voicePulse1 2s ease-out infinite" }}/>
//               <div style={{ position: "absolute", inset: "-30px", borderRadius: "50%", border: `2px solid ${isSpeaking ? C.accentL : "#ef4444"}`, opacity: 0.18, animation: "voicePulse2 2s ease-out infinite 0.4s" }}/>
//             </>
//           )}
//           <div style={{ width: "92px", height: "92px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "38px", color: "#fff", position: "relative", zIndex: 1 }}>✦</div>
//         </div>

//         <div style={{ textAlign: "center" }}>
//           <p style={{ margin: 0, color: C.white, fontSize: "18px", fontWeight: 600, fontFamily: F }}>MakeWithUs AI</p>
//           <p style={{ margin: "5px 0 0", fontSize: "13px", fontFamily: F, color: isSpeaking ? C.accentL : isListening ? "#f87171" : C.muted }}>
//             {isMuted ? " AI is muted" : isSpeaking ? " AI is speaking..." : isListening ? " Listening to you..." : isSending ? " Thinking..." : "Tap mic to speak"}
//           </p>
//           <p style={{ margin: "4px 0 0", color: C.muted, fontSize: "12px", fontFamily: "monospace" }}>{fmt(callDuration)}</p>
//         </div>

//         {messages.length > 0 && messages[messages.length-1].role === "assistant" && (
//           <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "12px 16px", width: "100%", maxHeight: "90px", overflowY: "auto" }}>
//             <p style={{ margin: 0, color: C.text, fontSize: "13px", lineHeight: 1.6, fontFamily: F }}>{messages[messages.length-1].content}</p>
//           </div>
//         )}

//         {isSending && (
//           <div style={{ display: "flex", gap: "5px" }}>
//             {[0,1,2].map(n => <span key={n} style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}
//           </div>
//         )}

//         <button onClick={toggleVoiceMic} disabled={isSending}
//           style={{ width: "74px", height: "74px", borderRadius: "50%", border: "none", cursor: isSending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: isListening ? "rgba(239,68,68,0.9)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, boxShadow: isListening ? "0 0 0 10px rgba(239,68,68,0.12)" : `0 0 0 10px rgba(124,58,237,0.12)`, transition: "all 0.2s", opacity: isSending ? 0.5 : 1 }}>
//           {isListening
//             ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>
//             : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
//           }
//         </button>

//         <p style={{ margin: 0, color: C.muted, fontSize: "12px", fontFamily: F }}>
//           {isListening ? "Tap to stop" : isSpeaking ? "Tap to interrupt" : "Tap to speak"}
//         </p>

//         {showLead && !leadSent && (
//           <div style={{ width: "100%" }}>
//             <LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg}/>
//           </div>
//         )}

//         <button onClick={() => setScreen("chat")}
//           style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, fontSize: "12px", padding: "6px 18px", borderRadius: "20px", cursor: "pointer", fontFamily: F, transition: "border-color 0.15s" }}
//           onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
//           onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//           Switch to chat →
//         </button>
//       </div>
//     </div>
//   );

//   // ── CALL US SCREEN ─────────────────────────────────────────────────────────
//   const CallScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader title="Call us" subtitle="Talk to a real person"/>
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "20px", padding: "30px" }}>
//         <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", border: `2px solid ${C.wa}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.wa} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
//         </div>
//         <div style={{ textAlign: "center" }}>
//           <p style={{ margin: "0 0 6px", color: C.muted, fontSize: "13px" }}>Call us directly at</p>
//           <a href={`tel:${PHONE_DIALABLE}`} style={{ color: C.white, fontSize: "24px", fontWeight: 700, textDecoration: "none", fontFamily: F }}>{PHONE_NUMBER}</a>
//           <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "12px" }}>Mon – Sat, 10am – 7pm IST</p>
//         </div>
//         <a href={`tel:${PHONE_DIALABLE}`}
//           style={{ display: "flex", alignItems: "center", gap: "8px", background: C.wa, borderRadius: "12px", padding: "14px 32px", color: "#fff", fontSize: "15px", fontWeight: 600, textDecoration: "none", fontFamily: F }}>
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
//           Tap to call
//         </a>
//         <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
//           <div style={{ flex: 1, height: "1px", background: C.border }}/>
//           <p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>or</p>
//           <div style={{ flex: 1, height: "1px", background: C.border }}/>
//         </div>
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
//           style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "12px", padding: "12px 24px", color: C.wa, fontSize: "14px", fontWeight: 500, textDecoration: "none", width: "100%", justifyContent: "center", boxSizing: "border-box", fontFamily: F }}>
//           <WaIcon size={16}/> Message on WhatsApp
//         </a>
//       </div>
//       <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
//       <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── MAIN RENDER ────────────────────────────────────────────────────────────
//   return (
//     <>
//       <link rel="preconnect" href="https://fonts.googleapis.com"/>
//       <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
//       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>

//       <ProactiveHint onOpen={openWidget}/>

//       <button onClick={isOpen ? closeWidget : openWidget} aria-label="Toggle chat"
//         style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(124,58,237,0.5)", transition: "transform 0.2s", fontSize: "22px", color: "#fff", fontFamily: F }}
//         onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)")}
//         onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}>
//         {isOpen ? "✕" : "✦"}
//       </button>

//       {isOpen && (
//         <div style={{ fontFamily: F, position: "fixed", bottom: "92px", right: "24px", zIndex: 9998, width: "380px", height: "590px", borderRadius: "20px", background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" }}>
//           {screen === "home"  && <HomeScreen/>}
//           {screen === "chat"  && <ChatScreen/>}
//           {screen === "voice" && <VoiceScreen/>}
//           {screen === "call"  && <CallScreen/>}
//         </div>
//       )}

//       <style>{`
//         @keyframes mwuBounce   { 0%,100%{transform:translateY(0);opacity:.4}  50%{transform:translateY(-4px);opacity:1} }
//         @keyframes mwuPulse    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
//         @keyframes voicePulse1 { 0%{transform:scale(1);opacity:.35} 100%{transform:scale(1.6);opacity:0} }
//         @keyframes voicePulse2 { 0%{transform:scale(1);opacity:.18} 100%{transform:scale(1.9);opacity:0} }
//       `}</style>
//     </>
//   );
// }



// "use client";
// import { useState, useEffect, useRef } from "react";
// import ProactiveHint from "./ProactiveHint";
// import LeadForm from "./LeadForm";

// // // ─── TYPES ────────────────────────────────────────────────────────────────────
// // interface Message { role: "user" | "assistant"; content: string; }
// // type Screen = "home" | "chat" | "voice" | "call" | "avatar";

// // ─── CONFIG — replace with your real details ──────────────────────────────────
// const WHATSAPP_NUMBER = "916395428620";
// const PHONE_NUMBER    = "+91 6395428620";
// const PHONE_DIALABLE  = "916395428620";
// const WHATSAPP_BASE   = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I found you through MakeWithUs and I'd like to know more.")}`;

// // ─── ONE FONT everywhere ──────────────────────────────────────────────────────
// // We inject this font at the top level so EVERY element inside the widget
// // uses Inter from Google Fonts — overrides all browser defaults
// const FONT = "'Inter', 'Segoe UI', Arial, sans-serif";

// // ─── BRAND COLORS ─────────────────────────────────────────────────────────────
// const C = {
//   bg:      "#1a1a2e",
//   surface: "#16213e",
//   header:  "#12122a",
//   input:   "#0d0d1f",
//   accent:  "#7c3aed",
//   accentL: "#8b5cf6",
//   white:   "#ffffff",
//   text:    "rgba(255,255,255,0.88)",
//   muted:   "rgba(255,255,255,0.55)",
//   border:  "rgba(124,58,237,0.25)",
//   wa:      "#25D366",
// };

// // ─── SESSION ──────────────────────────────────────────────────────────────────
// const PAGE_SESSION = Math.random().toString(36).slice(2);

// declare global {
//   interface Window {
//     SpeechRecognition: new () => SpeechRecognition;
//     webkitSpeechRecognition: new () => SpeechRecognition;
//   }
// }

// // ─── ICONS ────────────────────────────────────────────────────────────────────
// const WaIcon = ({ size = 14 }: { size?: number }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
//     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
//   </svg>
// );

// const ChatIcon = () => (
//   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
//   </svg>
// );

// const MicIcon = ({ color = C.accentL }: { color?: string }) => (
//   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
//     <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
//     <line x1="12" y1="19" x2="12" y2="23"/>
//     <line x1="8" y1="23" x2="16" y2="23"/>
//   </svg>
// );

// const PhoneIcon = ({ color = C.wa, size = 20 }: { color?: string; size?: number }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
//   </svg>
// );

// const VideoIcon = () => (
//   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <polygon points="23 7 16 12 23 17 23 7"/>
//     <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
//   </svg>
// );

// const StopIcon = () => (
//   <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
//     <rect x="5" y="5" width="14" height="14" rx="3"/>
//   </svg>
// );

// // ─── AVATAR COMPONENT — animated talking head ─────────────────────────────────
// // This draws an SVG avatar that animates its mouth when the AI is "talking"
// const AvatarFace = ({ isTalking, isListening }: { isTalking: boolean; isListening: boolean }) => {
//   return (
//     <div style={{ position: "relative", width: "160px", height: "160px" }}>
//       {/* Outer glow ring */}
//       <div style={{
//         position: "absolute", inset: "-10px", borderRadius: "50%",
//         background: `conic-gradient(${C.accent}, ${C.accentL}, ${C.accent})`,
//         animation: isTalking || isListening ? "spinRing 2s linear infinite" : "none",
//         opacity: isTalking || isListening ? 1 : 0.4,
//         transition: "opacity 0.3s",
//       }} />
//       {/* Inner mask to make it look like a ring */}
//       <div style={{
//         position: "absolute", inset: "-4px", borderRadius: "50%",
//         background: C.bg,
//       }} />

//       {/* Avatar face SVG */}
//       <svg
//         width="160" height="160" viewBox="0 0 160 160"
//         style={{ position: "relative", zIndex: 1 }}
//       >
//         {/* Face background circle */}
//         <defs>
//           <radialGradient id="faceGrad" cx="50%" cy="40%" r="60%">
//             <stop offset="0%" stopColor="#8b5cf6"/>
//             <stop offset="100%" stopColor="#4c1d95"/>
//           </radialGradient>
//           <radialGradient id="eyeGrad" cx="50%" cy="30%" r="70%">
//             <stop offset="0%" stopColor="#ffffff"/>
//             <stop offset="100%" stopColor="#c4b5fd"/>
//           </radialGradient>
//         </defs>

//         {/* Face */}
//         <circle cx="80" cy="80" r="72" fill="url(#faceGrad)"/>

//         {/* Subtle highlight */}
//         <ellipse cx="60" cy="52" rx="18" ry="10" fill="rgba(255,255,255,0.12)" transform="rotate(-20,60,52)"/>

//         {/* Left eye */}
//         <ellipse cx="57" cy="68" rx="9" ry="10" fill="url(#eyeGrad)"/>
//         <circle cx="59" cy="67" r="5" fill="#1e1b4b"/>
//         <circle cx="61" cy="65" r="1.5" fill="white"/>
//         {/* Eye blink */}
//         <ellipse cx="57" cy="68" rx="9" ry="10" fill="url(#faceGrad)" style={{ animation: "blink 4s ease-in-out infinite" }}/>

//         {/* Right eye */}
//         <ellipse cx="103" cy="68" rx="9" ry="10" fill="url(#eyeGrad)"/>
//         <circle cx="105" cy="67" r="5" fill="#1e1b4b"/>
//         <circle cx="107" cy="65" r="1.5" fill="white"/>
//         <ellipse cx="103" cy="68" rx="9" ry="10" fill="url(#faceGrad)" style={{ animation: "blink 4s ease-in-out 0.1s infinite" }}/>

//         {/* Eyebrows */}
//         <path d="M48 56 Q57 50 66 54" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
//         <path d="M94 54 Q103 50 112 56" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

//         {/* Nose */}
//         <path d="M80 78 Q77 88 74 92 Q80 95 86 92 Q83 88 80 78" fill="rgba(0,0,0,0.15)"/>

//         {/* Mouth — animates open/close when talking */}
//         {isTalking ? (
//           // Open mouth — talking
//           <ellipse cx="80" cy="108"
//             rx="14"
//             ry="8"
//             fill="#1e1b4b"
//             style={{ animation: "talkMouth 0.15s ease-in-out infinite alternate" }}
//           />
//         ) : isListening ? (
//           // Small open — listening
//           <ellipse cx="80" cy="108" rx="10" ry="4" fill="#1e1b4b"/>
//         ) : (
//           // Smile — idle
//           <path d="M66 104 Q80 118 94 104" stroke="rgba(255,255,255,0.8)" strokeWidth="3" fill="none" strokeLinecap="round"/>
//         )}

//         {/* Cheek blush */}
//         <ellipse cx="44" cy="90" rx="10" ry="6" fill="rgba(251,146,60,0.2)"/>
//         <ellipse cx="116" cy="90" rx="10" ry="6" fill="rgba(251,146,60,0.2)"/>

//         {/* Sound waves when talking */}
//         {isTalking && (
//           <>
//             <ellipse cx="80" cy="108" rx="20" ry="12" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="2" style={{ animation: "soundWave 0.8s ease-out infinite" }}/>
//             <ellipse cx="80" cy="108" rx="28" ry="16" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="1.5" style={{ animation: "soundWave 0.8s ease-out 0.2s infinite" }}/>
//           </>
//         )}
//       </svg>

//       {/* Status indicator dot */}
//       <div style={{
//         position: "absolute", bottom: "8px", right: "8px",
//         width: "16px", height: "16px", borderRadius: "50%",
//         background: isListening ? "#ef4444" : isTalking ? C.accentL : C.wa,
//         border: "2px solid " + C.bg,
//         zIndex: 2,
//         transition: "background 0.3s",
//         animation: isListening || isTalking ? "statusPulse 1s ease-in-out infinite" : "none",
//       }} />
//     </div>
//   );
// };

// // ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// export default function ChatWidget() {
//   const [isOpen,      setIsOpen]      = useState(false);
//   const [screen,      setScreen]      = useState<Screen>("home");
//   const [messages,    setMessages]    = useState<Message[]>([]);
//   const [input,       setInput]       = useState("");
//   const [isLoading,   setIsLoading]   = useState(false);
//   const [isTyping,    setIsTyping]    = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [isTalking,   setIsTalking]   = useState(false); // avatar mouth animation
//   const [voiceOk,     setVoiceOk]     = useState(false);
//   const [voiceStatus, setVoiceStatus] = useState("Tap the mic to speak");
//   const [callDuration,setCallDuration]= useState(0);
//   const [showLead,    setShowLead]    = useState(false);
//   const [leadSent,    setLeadSent]    = useState(false);
//   const [lastUserMsg, setLastUserMsg] = useState("");
//   // Avatar last reply text (shown on avatar screen)
//   const [avatarReply, setAvatarReply] = useState("Hi! I'm your MakeWithUs AI assistant. How can I help you today?");

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const inputRef       = useRef<HTMLInputElement>(null);
//   const recognitionRef = useRef<SpeechRecognition | null>(null);
//   const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
//   const talkTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // ── Voice support ────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (typeof window !== "undefined" &&
//       (window.SpeechRecognition || window.webkitSpeechRecognition)) {
//       setVoiceOk(true);
//     }
//   }, []);

//   // ── Session clear on fresh load ──────────────────────────────────────────
//   useEffect(() => {
//     const last = sessionStorage.getItem("mwu_session");
//     if (last !== PAGE_SESSION) {
//       sessionStorage.setItem("mwu_session", PAGE_SESSION);
//       sessionStorage.removeItem("mwu_msgs");
//       setMessages([]);
//     } else {
//       try {
//         const s = sessionStorage.getItem("mwu_msgs");
//         if (s) setMessages(JSON.parse(s));
//       } catch { setMessages([]); }
//     }
//   }, []);

//   useEffect(() => {
//     if (messages.length > 0)
//       sessionStorage.setItem("mwu_msgs", JSON.stringify(messages));
//   }, [messages]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isTyping, showLead]);

//   useEffect(() => {
//     if (isOpen && screen === "chat")
//       setTimeout(() => inputRef.current?.focus(), 120);
//   }, [isOpen, screen]);

//   // Stop voice when leaving voice/avatar screens
//   useEffect(() => {
//     if (screen !== "voice" && screen !== "avatar") {
//       stopListening();
//       if (timerRef.current) clearInterval(timerRef.current);
//       setCallDuration(0);
//       setVoiceStatus("Tap the mic to speak");
//     }
//   }, [screen]);

//   // ── Voice functions ───────────────────────────────────────────────────────
//   const startListening = (onTranscript?: (t: string) => void) => {
//     if (!voiceOk) return;
//     const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
//     const rec = new SR();
//     recognitionRef.current = rec;
//     rec.lang = "en-IN";
//     rec.interimResults = false;
//     rec.maxAlternatives = 1;
//     rec.onstart  = () => { setIsListening(true); setVoiceStatus("Listening..."); };
//     rec.onresult = (e: SpeechRecognitionEvent) => {
//       const t = e.results[0][0].transcript;
//       if (onTranscript) onTranscript(t);
//       else setInput(p => p ? p + " " + t : t);
//     };
//     rec.onerror = () => { setIsListening(false); setVoiceStatus("Tap the mic to speak"); };
//     rec.onend   = () => { setIsListening(false); setVoiceStatus("Tap the mic to speak"); };
//     rec.start();
//   };

//   const stopListening = () => {
//     recognitionRef.current?.stop();
//     setIsListening(false);
//   };

//   const toggleChatMic = () => {
//     if (isListening) stopListening(); else startListening();
//   };

//   const toggleVoiceMic = () => {
//     if (isListening) stopListening();
//     else startListening((t) => sendMessage(t));
//   };

//   const toggleAvatarMic = () => {
//     if (isListening) stopListening();
//     else startListening((t) => sendMessageAvatar(t));
//   };

//   const startTimer = () => {
//     setCallDuration(0);
//     timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
//   };

//   const fmt = (s: number) => {
//     const m = Math.floor(s / 60).toString().padStart(2, "0");
//     return `${m}:${(s % 60).toString().padStart(2, "0")}`;
//   };

//   // ── Send message (chat + voice screens) ──────────────────────────────────
//   const sendMessage = async (text?: string) => {
//     const msg = (text ?? input).trim();
//     if (!msg || isLoading) return;
//     setLastUserMsg(msg);
//     const userMsg: Message = { role: "user", content: msg };
//     const updated = [...messages, userMsg];
//     setMessages(updated);
//     setInput("");
//     setIsLoading(true);
//     setIsTyping(true);
//     if (screen === "voice") setScreen("chat");

//     try {
//       const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: updated }) });
//       const data = await res.json();
//       setIsTyping(false);
//       if (!res.ok) { setMessages(p => [...p, { role: "assistant", content: `⚠️ ${data.error || "Error"}` }]); return; }
//       setMessages(p => [...p, { role: "assistant", content: data.reply }]);
//       if (data.intent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
//     } catch {
//       setIsTyping(false);
//       setMessages(p => [...p, { role: "assistant", content: "⚠️ Cannot connect. Is Ollama running?" }]);
//     } finally { setIsLoading(false); }
//   };

//   // ── Send message (avatar screen) — animates mouth ─────────────────────────
//   const sendMessageAvatar = async (text: string) => {
//     const msg = text.trim();
//     if (!msg || isLoading) return;
//     setLastUserMsg(msg);
//     const userMsg: Message = { role: "user", content: msg };
//     const updated = [...messages, userMsg];
//     setMessages(updated);
//     setIsLoading(true);
//     setAvatarReply("Thinking...");

//     try {
//       const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: updated }) });
//       const data = await res.json();
//       if (!res.ok) { setAvatarReply(`⚠️ ${data.error || "Error"}`); return; }

//       const reply: string = data.reply;
//       setMessages(p => [...p, { role: "assistant", content: reply }]);
//       setAvatarReply(reply);

//       // Animate talking: estimate ~70ms per character, min 2s max 6s
//       const talkDuration = Math.min(Math.max(reply.length * 70, 2000), 6000);
//       setIsTalking(true);

//       // Use browser TTS to actually speak the reply
//       if (typeof window !== "undefined" && window.speechSynthesis) {
//         const utt = new SpeechSynthesisUtterance(reply);
//         utt.lang  = "en-IN";
//         utt.rate  = 1;
//         utt.pitch = 1;
//         utt.onend = () => setIsTalking(false);
//         window.speechSynthesis.cancel(); // cancel any previous
//         window.speechSynthesis.speak(utt);
//       } else {
//         // Fallback: just time the animation
//         if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
//         talkTimerRef.current = setTimeout(() => setIsTalking(false), talkDuration);
//       }

//       if (data.intent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
//     } catch {
//       setAvatarReply("⚠️ Cannot connect. Is Ollama running?");
//     } finally { setIsLoading(false); }
//   };

//   const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
//   };

//   const handleLeadSuccess = (name: string) => {
//     setLeadSent(true); setShowLead(false);
//     setMessages(p => [...p, { role: "assistant", content: `Great, ${name}! Opening WhatsApp now. Our team will reply shortly. 🙌` }]);
//   };
//   const handleLeadDismiss = () => {
//     setShowLead(false);
//     setMessages(p => [...p, { role: "assistant", content: "No worries! Feel free to ask me anything else." }]);
//   };

//   const clearChat = () => {
//     setMessages([]); setShowLead(false); setLeadSent(false); setLastUserMsg("");
//     sessionStorage.removeItem("mwu_msgs");
//   };

//   const openWidget = () => { setIsOpen(true); setScreen("home"); };
//   const closeWidget = () => {
//     setIsOpen(false); stopListening();
//     if (timerRef.current) clearInterval(timerRef.current);
//     if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
//     if (typeof window !== "undefined") window.speechSynthesis?.cancel();
//     setIsTalking(false);
//   };

//   const prompts = ["What services do you offer?", "Tell me about your pricing", "How do I get started?"];

//   // ── BASE STYLE — applied to root div so all children inherit font ──────────
//   const widgetBase: React.CSSProperties = {
//     fontFamily: FONT,
//     fontSize: "14px",
//     lineHeight: 1.5,
//     color: C.text,
//     boxSizing: "border-box",
//   };

//   // ── SHARED HEADER ─────────────────────────────────────────────────────────
//   const SharedHeader = ({ title, subtitle, showBack = true, onBack }: {
//     title: string; subtitle?: string; showBack?: boolean; onBack?: () => void;
//   }) => (
//     <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, fontFamily: FONT }}>
//       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//         {showBack && (
//           <button onClick={onBack || (() => { stopListening(); if (timerRef.current) clearInterval(timerRef.current); window.speechSynthesis?.cancel(); setIsTalking(false); setScreen("home"); })}
//             style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: FONT, flexShrink: 0 }}>
//             ←
//           </button>
//         )}
//         <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff", flexShrink: 0 }}>✦</div>
//         <div>
//           <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "14px", fontFamily: FONT }}>{title}</p>
//           {subtitle && <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "11px", fontFamily: FONT }}>{subtitle}</p>}
//         </div>
//       </div>
//       <button onClick={closeWidget}
//         style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: FONT }}>
//         ✕
//       </button>
//     </div>
//   );

//   // ── HOME SCREEN ───────────────────────────────────────────────────────────
//   const HomeScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: FONT }}>
//       {/* Header */}
//       <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "28px 20px 24px", flexShrink: 0 }}>
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//             <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff" }}>✦</div>
//             <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "16px", fontFamily: FONT }}>MakeWithUs AI</p>
//           </div>
//           <button onClick={closeWidget} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: FONT }}>✕</button>
//         </div>
//         <p style={{ margin: 0, color: "#fff", fontSize: "22px", fontWeight: 700, fontFamily: FONT }}>Hi there! 👋</p>
//         <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "14px", fontFamily: FONT }}>Let's get you started</p>
//       </div>

//       {/* Options */}
//       <div style={{ flex: 1, background: C.bg, padding: "16px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
//         {[
//           { label: "Start chat", sub: "Chat with our AI assistant", icon: <ChatIcon />, iconBg: "rgba(124,58,237,0.15)", onClick: () => setScreen("chat"), hoverBorder: C.accentL },
//           { label: "Start voice call", sub: "Speak with our AI assistant", icon: <MicIcon />, iconBg: "rgba(124,58,237,0.15)", onClick: () => { startTimer(); setScreen("voice"); }, hoverBorder: C.accentL, hide: !voiceOk },
//           { label: "Video AI chat", sub: "Chat with AI avatar", icon: <VideoIcon />, iconBg: "rgba(124,58,237,0.15)", onClick: () => { startTimer(); setScreen("avatar"); }, hoverBorder: C.accentL },
//           { label: "Call us", sub: "Talk to a real person", icon: <PhoneIcon />, iconBg: "rgba(37,211,102,0.12)", onClick: () => setScreen("call"), hoverBorder: C.wa },
//         ].filter(r => !r.hide).map(row => (
//           <button key={row.label} onClick={row.onClick}
//             style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", cursor: "pointer", width: "100%", fontFamily: FONT, transition: "border-color 0.15s" }}
//             onMouseEnter={e => (e.currentTarget.style.borderColor = row.hoverBorder)}
//             onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//             <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
//               <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: row.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.icon}</div>
//               <div style={{ textAlign: "left" }}>
//                 <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: FONT }}>{row.label}</p>
//                 <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: FONT }}>{row.sub}</p>
//               </div>
//             </div>
//             <span style={{ color: C.muted, fontSize: "20px", fontFamily: FONT }}>›</span>
//           </button>
//         ))}

//         {/* WhatsApp */}
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
//           style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 16px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "12px", cursor: "pointer", textDecoration: "none", fontFamily: FONT, transition: "border-color 0.15s" }}
//           onMouseEnter={e => (e.currentTarget.style.borderColor = C.wa)}
//           onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(37,211,102,0.25)")}>
//           <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
//             <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(37,211,102,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.wa }}><WaIcon size={20} /></div>
//             <div style={{ textAlign: "left" }}>
//               <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: FONT }}>WhatsApp us</p>
//               <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: FONT }}>Message us directly</p>
//             </div>
//           </div>
//           <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
//         </a>
//       </div>

//       <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: FONT }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── CHAT SCREEN ───────────────────────────────────────────────────────────
//   const ChatScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: FONT }}>
//       <SharedHeader title="MakeWithUs AI" subtitle={isTyping ? "Typing..." : "Online · Powered by Ollama"} />

//       <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: C.bg }}>
//         {messages.length === 0 && (
//           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "11px" }}>
//             <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "#fff" }}>✦</div>
//             <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: C.white, fontFamily: FONT }}>Hey! How can I help you?</p>
//             <p style={{ margin: 0, fontSize: "13px", color: C.muted, textAlign: "center", lineHeight: 1.6, fontFamily: FONT }}>Ask about services, pricing,<br />or how we can grow your business.</p>
//             <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%", marginTop: "4px" }}>
//               {prompts.map(p => (
//                 <button key={p} onClick={() => sendMessage(p)}
//                   style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px 14px", fontSize: "13px", cursor: "pointer", color: C.text, textAlign: "left", fontFamily: FONT, transition: "border-color 0.15s" }}
//                   onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
//                   onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//                   {p}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {messages.map((msg, i) => (
//           <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
//             {msg.role === "assistant" && (
//               <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>✦</div>
//             )}
//             <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: msg.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentL})` : C.surface, color: msg.role === "user" ? "#fff" : C.text, fontSize: "13px", lineHeight: "1.65", fontFamily: FONT, border: msg.role === "assistant" ? `1px solid ${C.border}` : "none", whiteSpace: "pre-wrap" }}>
//               {msg.content}
//             </div>
//           </div>
//         ))}

//         {isTyping && (
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0 }}>✦</div>
//             <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 3px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: "4px", alignItems: "center" }}>
//               {[0,1,2].map(n => <span key={n} style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}
//             </div>
//           </div>
//         )}

//         {showLead && !leadSent && (
//           <LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg} />
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input bar */}
//       <div style={{ padding: "12px 14px", background: C.header, borderTop: `1px solid ${C.border}`, display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
//         {voiceOk && (
//           <button onClick={toggleChatMic}
//             style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: isListening ? "rgba(239,68,68,0.85)" : "rgba(124,58,237,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s", animation: isListening ? "mwuPulse 1.2s ease-in-out infinite" : "none" }}>
//             {isListening ? <StopIcon /> : <MicIcon />}
//           </button>
//         )}
//         <input ref={inputRef} type="text" value={input}
//           onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
//           placeholder={isListening ? "🎤 Listening..." : "Ask anything..."}
//           disabled={isLoading}
//           style={{ flex: 1, border: `1px solid ${isListening ? "rgba(239,68,68,0.5)" : C.border}`, borderRadius: "22px", padding: "9px 15px", fontSize: "13px", outline: "none", background: C.input, color: C.white, fontFamily: FONT, transition: "border-color 0.15s" }}
//           onFocus={e => (e.currentTarget.style.borderColor = C.accentL)}
//           onBlur={e  => (e.currentTarget.style.borderColor = isListening ? "rgba(239,68,68,0.5)" : C.border)}
//         />
//         <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
//           style={{ width: "36px", height: "36px", borderRadius: "50%", background: isLoading || !input.trim() ? "rgba(124,58,237,0.25)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: "#fff", flexShrink: 0 }}>
//           ➤
//         </button>
//       </div>
//       {isListening && <div style={{ background: "rgba(239,68,68,0.12)", borderTop: "1px solid rgba(239,68,68,0.2)", padding: "6px 14px", fontSize: "11px", color: "#f87171", textAlign: "center", flexShrink: 0, fontFamily: FONT }}>🎤 Listening... tap mic to stop</div>}

//       <div style={{ background: C.header, padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", color: C.wa, fontSize: "11px", textDecoration: "none", fontFamily: FONT }}><WaIcon size={12} /> WhatsApp</a>
//         <button onClick={clearChat} style={{ background: "none", border: "none", color: C.muted, fontSize: "11px", cursor: "pointer", fontFamily: FONT }}>Clear chat</button>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: FONT }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── AVATAR VIDEO CHAT SCREEN ───────────────────────────────────────────────
//   const AvatarScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: FONT }}>
//       <SharedHeader title="Video AI Chat" subtitle={isTalking ? "Speaking..." : isListening ? "Listening..." : "Tap mic to speak"} />

//       {/* Avatar area */}
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", background: C.bg, padding: "20px 16px", gap: "16px", overflowY: "auto" }}>

//         {/* Timer */}
//         <p style={{ margin: 0, color: C.accentL, fontSize: "12px", fontFamily: "monospace" }}>{fmt(callDuration)}</p>

//         {/* Animated avatar */}
//         <AvatarFace isTalking={isTalking} isListening={isListening} />

//         <p style={{ margin: 0, color: C.white, fontSize: "15px", fontWeight: 600, fontFamily: FONT }}>MakeWithUs AI</p>

//         {/* Speech bubble — shows what AI said */}
//         <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px 16px 16px 4px", padding: "14px 16px", width: "100%", maxHeight: "120px", overflowY: "auto" }}>
//           {isLoading
//             ? <div style={{ display: "flex", gap: "4px", justifyContent: "center", padding: "4px 0" }}>
//                 {[0,1,2].map(n => <span key={n} style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}
//               </div>
//             : <p style={{ margin: 0, color: C.text, fontSize: "13px", lineHeight: 1.65, fontFamily: FONT }}>{avatarReply}</p>
//           }
//         </div>

//         {/* User's last message */}
//         {lastUserMsg && (
//           <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, borderRadius: "16px 16px 4px 16px", padding: "10px 14px", alignSelf: "flex-end", maxWidth: "85%" }}>
//             <p style={{ margin: 0, color: "#fff", fontSize: "12px", fontFamily: FONT }}>{lastUserMsg}</p>
//           </div>
//         )}

//         {/* Lead form inside avatar screen */}
//         {showLead && !leadSent && (
//           <div style={{ width: "100%" }}>
//             <LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg} />
//           </div>
//         )}
//       </div>

//       {/* Controls */}
//       <div style={{ background: C.header, borderTop: `1px solid ${C.border}`, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", flexShrink: 0 }}>
//         {/* Mic button */}
//         <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
//           <button onClick={toggleAvatarMic}
//             style={{ width: "56px", height: "56px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: isListening ? "rgba(239,68,68,0.9)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, boxShadow: isListening ? "0 0 0 8px rgba(239,68,68,0.15)" : `0 0 0 8px rgba(124,58,237,0.15)`, transition: "all 0.2s" }}>
//             {isListening ? <StopIcon /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
//           </button>
//           <p style={{ margin: 0, color: C.muted, fontSize: "11px", fontFamily: FONT }}>{isListening ? "Stop" : "Speak"}</p>
//         </div>

//         {/* Stop TTS */}
//         <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
//           <button onClick={() => { window.speechSynthesis?.cancel(); setIsTalking(false); }}
//             style={{ width: "56px", height: "56px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", transition: "all 0.2s" }}>
//             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
//             </svg>
//           </button>
//           <p style={{ margin: 0, color: C.muted, fontSize: "11px", fontFamily: FONT }}>Mute AI</p>
//         </div>

//         {/* Switch to chat */}
//         <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
//           <button onClick={() => setScreen("chat")}
//             style={{ width: "56px", height: "56px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", transition: "all 0.2s" }}>
//             <ChatIcon />
//           </button>
//           <p style={{ margin: 0, color: C.muted, fontSize: "11px", fontFamily: FONT }}>Chat</p>
//         </div>
//       </div>
//     </div>
//   );

//   // ── VOICE CALL SCREEN ─────────────────────────────────────────────────────
//   const VoiceScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: FONT }}>
//       <SharedHeader title="Voice call" subtitle="MakeWithUs AI" />
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "20px", padding: "30px" }}>
//         <div style={{ position: "relative" }}>
//           {isListening && <>
//             <div style={{ position: "absolute", inset: "-16px", borderRadius: "50%", border: `2px solid ${C.accentL}`, opacity: 0.3, animation: "voicePulse1 2s ease-out infinite" }}/>
//             <div style={{ position: "absolute", inset: "-28px", borderRadius: "50%", border: `2px solid ${C.accentL}`, opacity: 0.15, animation: "voicePulse2 2s ease-out infinite 0.4s" }}/>
//           </>}
//           <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", color: "#fff", position: "relative", zIndex: 1 }}>✦</div>
//         </div>
//         <div style={{ textAlign: "center" }}>
//           <p style={{ margin: 0, color: C.white, fontSize: "18px", fontWeight: 600, fontFamily: FONT }}>MakeWithUs AI</p>
//           <p style={{ margin: "4px 0 0", color: C.muted, fontSize: "13px", fontFamily: FONT }}>{voiceStatus}</p>
//           <p style={{ margin: "4px 0 0", color: C.accentL, fontSize: "12px", fontFamily: "monospace" }}>{fmt(callDuration)}</p>
//         </div>
//         {messages.length > 0 && messages[messages.length-1].role === "assistant" && (
//           <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "12px 16px", maxWidth: "100%", textAlign: "center" }}>
//             <p style={{ margin: 0, color: C.text, fontSize: "13px", lineHeight: 1.6, fontFamily: FONT }}>{messages[messages.length-1].content}</p>
//           </div>
//         )}
//         {isTyping && <div style={{ display: "flex", gap: "5px" }}>{[0,1,2].map(n => <span key={n} style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}</div>}
//         <button onClick={toggleVoiceMic}
//           style={{ width: "72px", height: "72px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: isListening ? "rgba(239,68,68,0.9)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, boxShadow: isListening ? "0 0 0 8px rgba(239,68,68,0.15)" : `0 0 0 8px rgba(124,58,237,0.15)`, transition: "all 0.2s" }}>
//           {isListening ? <StopIcon /> : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
//         </button>
//         <p style={{ margin: 0, color: C.muted, fontSize: "12px", fontFamily: FONT }}>{isListening ? "Tap to stop" : "Tap to speak"}</p>
//         <button onClick={() => setScreen("chat")} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, fontSize: "12px", padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontFamily: FONT }}>Switch to chat →</button>
//       </div>
//     </div>
//   );

//   // ── CALL US SCREEN ────────────────────────────────────────────────────────
//   const CallScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: FONT }}>
//       <SharedHeader title="Call us" subtitle="Talk to a real person" />
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "20px", padding: "30px" }}>
//         <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", border: `2px solid ${C.wa}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <PhoneIcon size={36} />
//         </div>
//         <div style={{ textAlign: "center" }}>
//           <p style={{ margin: "0 0 6px", color: C.muted, fontSize: "13px", fontFamily: FONT }}>Call us directly at</p>
//           <a href={`tel:${PHONE_DIALABLE}`} style={{ color: C.white, fontSize: "24px", fontWeight: 700, textDecoration: "none", fontFamily: FONT, letterSpacing: "0.5px" }}>{PHONE_NUMBER}</a>
//           <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "12px", fontFamily: FONT }}>Mon – Sat, 10am – 7pm IST</p>
//         </div>
//         <a href={`tel:${PHONE_DIALABLE}`} style={{ display: "flex", alignItems: "center", gap: "8px", background: C.wa, borderRadius: "12px", padding: "14px 32px", color: "#fff", fontSize: "15px", fontWeight: 600, textDecoration: "none", fontFamily: FONT }}>
//           <PhoneIcon color="white" size={18} /> Tap to call
//         </a>
//         <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
//           <div style={{ flex: 1, height: "1px", background: C.border }}/>
//           <p style={{ margin: 0, color: C.muted, fontSize: "12px", fontFamily: FONT }}>or</p>
//           <div style={{ flex: 1, height: "1px", background: C.border }}/>
//         </div>
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(37,211,102,0.1)", border: `1px solid rgba(37,211,102,0.3)`, borderRadius: "12px", padding: "12px 24px", color: C.wa, fontSize: "14px", fontWeight: 500, textDecoration: "none", width: "100%", justifyContent: "center", boxSizing: "border-box", fontFamily: FONT }}>
//           <WaIcon size={16} /> Message on WhatsApp
//         </a>
//         <p style={{ margin: 0, color: C.muted, fontSize: "11px", textAlign: "center", fontFamily: FONT }}>Prefer not to call? Use our AI chat or WhatsApp.</p>
//       </div>
//       <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: FONT }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── MAIN RENDER ───────────────────────────────────────────────────────────
//   return (
//     <>
//       {/* Load Inter font from Google Fonts */}
//       <link rel="preconnect" href="https://fonts.googleapis.com" />
//       <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
//       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

//       <ProactiveHint onOpen={openWidget} />

//       {/* Floating button */}
//       <button onClick={isOpen ? closeWidget : openWidget} aria-label="Toggle chat"
//         style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(124,58,237,0.5)", transition: "transform 0.2s", fontSize: "22px", color: "#fff", fontFamily: FONT }}
//         onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)")}
//         onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}>
//         {isOpen ? "✕" : "✦"}
//       </button>

//       {/* Widget window */}
//       {isOpen && (
//         <div style={{ ...widgetBase, position: "fixed", bottom: "92px", right: "24px", zIndex: 9998, width: "380px", height: "600px", borderRadius: "20px", background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" }}>
//           {screen === "home"   && <HomeScreen />}
//           {screen === "chat"   && <ChatScreen />}
//           {screen === "voice"  && <VoiceScreen />}
//           {screen === "avatar" && <AvatarScreen />}
//           {screen === "call"   && <CallScreen />}
//         </div>
//       )}

//       <style>{`
//         @keyframes mwuBounce   { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
//         @keyframes mwuPulse    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
//         @keyframes voicePulse1 { 0%{transform:scale(1);opacity:.3} 100%{transform:scale(1.5);opacity:0} }
//         @keyframes voicePulse2 { 0%{transform:scale(1);opacity:.15} 100%{transform:scale(1.8);opacity:0} }
//         @keyframes spinRing    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
//         @keyframes talkMouth   { from{ry:3} to{ry:9} }
//         @keyframes soundWave   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
//         @keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
//         @keyframes blink       { 0%,90%,100%{ry:10} 95%{ry:1} }
//       `}</style>
//     </>
//   );
// }
// "use client";
// import { useState, useEffect, useRef } from "react";
// import ProactiveHint from "./ProactiveHint";
// import LeadForm from "./LeadForm";

// interface Message { role: "user" | "assistant"; content: string; }
// type Screen = "home" | "chat" | "voice" | "call";

// const WHATSAPP_NUMBER = "916395428620";
// const PHONE_NUMBER    = "+91 63954 28620";
// const PHONE_DIALABLE  = "916395428620";
// const WHATSAPP_BASE   = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I found you through MakeWithUs and I'd like to know more.")}`;
// const F               = "'Inter','Segoe UI',system-ui,-apple-system,Arial,sans-serif";

// const C = {
//   bg:      "#1a1a2e",
//   surface: "#16213e",
//   header:  "#12122a",
//   input:   "#0d0d1f",
//   accent:  "#7c3aed",
//   accentL: "#8b5cf6",
//   white:   "#ffffff",
//   text:    "rgba(255,255,255,0.88)",
//   muted:   "rgba(255,255,255,0.55)",
//   border:  "rgba(124,58,237,0.25)",
//   wa:      "#25D366",
// };

// const PAGE_SESSION = Math.random().toString(36).slice(2);

// declare global {
//   interface Window {
//     SpeechRecognition: new () => SpeechRecognition;
//     webkitSpeechRecognition: new () => SpeechRecognition;
//   }
// }

// const WaIcon = ({ size = 14 }: { size?: number }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
//     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
//   </svg>
// );

// export default function ChatWidget() {

//   const [isOpen,       setIsOpen]       = useState(false);
//   const [screen,       setScreen]       = useState<Screen>("home");
//   const [messages,     setMessages]     = useState<Message[]>([]);
//   const [input,        setInput]        = useState("");
//   const [isSending,    setIsSending]    = useState(false);
//   const [isTyping,     setIsTyping]     = useState(false);
//   const [isStreaming,  setIsStreaming]  = useState(false);
//   const [isListening,  setIsListening]  = useState(false);
//   const [isSpeaking,   setIsSpeaking]   = useState(false);
//   const [voiceOk,      setVoiceOk]      = useState(false);
//   const [isMuted,      setIsMuted]      = useState(false);
//   const [voiceStatus,  setVoiceStatus]  = useState("Tap the mic to speak");
//   const [callDuration, setCallDuration] = useState(0);
//   const [showLead,     setShowLead]     = useState(false);
//   const [leadSent,     setLeadSent]     = useState(false);
//   const [lastUserMsg,  setLastUserMsg]  = useState("");

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const inputRef       = useRef<HTMLInputElement>(null);
//   const recognitionRef = useRef<SpeechRecognition | null>(null);
//   const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
//   const abortRef       = useRef<AbortController | null>(null);

//   const screenRef     = useRef<Screen>("home");
//   const isMutedRef    = useRef(false);
//   const isSpeakingRef = useRef(false);
//   const isSendingRef  = useRef(false);
//   const messagesRef   = useRef<Message[]>([]);

//   useEffect(() => { screenRef.current     = screen;    }, [screen]);
//   useEffect(() => { isMutedRef.current    = isMuted;   }, [isMuted]);
//   useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
//   useEffect(() => { isSendingRef.current  = isSending;  }, [isSending]);
//   useEffect(() => { messagesRef.current   = messages;   }, [messages]);

//   // ── Browser capability check ───────────────────────────────────────────────
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if (window.SpeechRecognition || window.webkitSpeechRecognition) setVoiceOk(true);
//     if (window.speechSynthesis) {
//       window.speechSynthesis.getVoices();
//       window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
//     }
//   }, []);

//   // ── Session management ─────────────────────────────────────────────────────
//   useEffect(() => {
//     const last = sessionStorage.getItem("mwu_session");
//     if (last !== PAGE_SESSION) {
//       sessionStorage.setItem("mwu_session", PAGE_SESSION);
//       sessionStorage.removeItem("mwu_msgs");
//       setMessages([]);
//     } else {
//       try { const s = sessionStorage.getItem("mwu_msgs"); if (s) setMessages(JSON.parse(s)); }
//       catch { setMessages([]); }
//     }
//   }, []);

//   useEffect(() => {
//     if (messages.length > 0) sessionStorage.setItem("mwu_msgs", JSON.stringify(messages));
//   }, [messages]);

//  useEffect(() => {
//   if (
//     messages.length > 0 &&
//     !isTyping &&
//     document.activeElement !== inputRef.current
//   ) {
//     messagesEndRef.current?.scrollIntoView({
//       behavior: "smooth",
//     });
//   }
// }, [messages]);

//   useEffect(() => {
//   if (
//     isOpen &&
//     screen === "chat" &&
//     !isStreaming &&
//     !isSending
//   ) {
//     // inputRef.current?.focus();
//     requestAnimationFrame(() => {
//   inputRef.current?.focus({
//     preventScroll: true,
//   });
// });
//   }
// }, [isOpen, screen, isStreaming, isSending]);

//   useEffect(() => {
//     if (screen !== "voice") {
//       stopListening();
//       stopSpeakingNow();
//       if (timerRef.current) clearInterval(timerRef.current);
//       setCallDuration(0);
//       setVoiceStatus("Tap the mic to speak");
//       setIsSpeaking(false);
//     }
//   }, [screen]);

//   // ── TTS ────────────────────────────────────────────────────────────────────
//   function stopSpeakingNow() {
//     try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch { /* ignore */ }
//     setIsSpeaking(false);
//     isSpeakingRef.current = false;
//   }

//   function speakText(text: string) {
//     if (typeof window === "undefined" || !window.speechSynthesis) return;
//     if (isMutedRef.current) return;
//     try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
//     setIsSpeaking(false);

//     setTimeout(() => {
//       if (isMutedRef.current) return;
//       let utt: SpeechSynthesisUtterance;
//       try { utt = new SpeechSynthesisUtterance(text); } catch { return; }

//       utt.lang = "en-US"; utt.rate = 1.0; utt.pitch = 1.0; utt.volume = 1.0;

//       try {
//         const voices    = window.speechSynthesis.getVoices();
//         const preferred = voices.find(v =>
//           v.lang.startsWith("en") &&
//           (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen"))
//         ) || voices.find(v => v.lang.startsWith("en") && !v.name.includes("Zira"));
//         if (preferred) utt.voice = preferred;
//       } catch { /* use default */ }

//       utt.onstart = () => { setIsSpeaking(true); isSpeakingRef.current = true; setVoiceStatus("AI is speaking..."); };
//       utt.onend   = () => {
//         setIsSpeaking(false); isSpeakingRef.current = false;
//         setVoiceStatus("Tap the mic to speak");
//         if (screenRef.current === "voice" && !isMutedRef.current) {
//           setTimeout(() => {
//             if (screenRef.current === "voice" && !isSpeakingRef.current && !isSendingRef.current)
//               startListeningVoice();
//           }, 600);
//         }
//       };
//       utt.onerror = (_e: SpeechSynthesisErrorEvent) => {
//         setIsSpeaking(false); isSpeakingRef.current = false;
//         setVoiceStatus("Tap the mic to speak");
//       };

//       try { window.speechSynthesis.speak(utt); } catch { setIsSpeaking(false); }
//     }, 150);
//   }

//   const toggleMute = () => {
//     const next = !isMuted;
//     setIsMuted(next); isMutedRef.current = next;
//     if (next) stopSpeakingNow();
//   };
//    useEffect(() => {
//     if (isOpen && screen === "chat") {
//       requestAnimationFrame(() => {
//         inputRef.current?.focus({
//           preventScroll: true,
//         });
//       });
//     }
//   }, [isOpen, screen]);

//   // ── Speech Recognition ─────────────────────────────────────────────────────
//   function startListening(onTranscript?: (t: string) => void) {
//     if (!voiceOk || isSpeakingRef.current) return;
//     try {
//       if (recognitionRef.current) {
//         recognitionRef.current.onend = null;
//         recognitionRef.current.onerror = null;
//         recognitionRef.current.stop();
//       }
//     } catch { /* ignore */ }

//     const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
//     const rec = new SR();
//     recognitionRef.current = rec;
//     rec.lang = "en-IN"; rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;

//     rec.onstart  = () => { setIsListening(true); setVoiceStatus("Listening..."); };
// rec.onresult = (e: SpeechRecognitionEvent) => {
//   const t = e.results[0][0].transcript.trim();

//   if (!t) return;

//   if (onTranscript) {
//     onTranscript(t);
//   } else {
//     setInput((p) => (p ? p + " " + t : t));
//   }
// };
//     rec.onerror  = (e: SpeechRecognitionErrorEvent) => {
//       if (e.error !== "no-speech" && e.error !== "aborted") console.warn("STT:", e.error);
//       setIsListening(false); setVoiceStatus("Tap the mic to speak");
//     };
//     rec.onend    = () => { setIsListening(false); setVoiceStatus("Tap the mic to speak"); };
//     try { rec.start(); } catch { setIsListening(false); }
//   }

//   function startListeningVoice() { startListening(t => sendMessageVoice(t)); }
//   function stopListening() {
//     try { if (recognitionRef.current) { recognitionRef.current.onend = null; recognitionRef.current.onerror = null; recognitionRef.current.stop(); } } catch { /* ignore */ }
//     setIsListening(false);
//   }

//   const toggleChatMic  = () => { if (isListening) stopListening(); else startListening(); };
//   const toggleVoiceMic = () => { if (isListening) { stopListening(); } else { stopSpeakingNow(); startListeningVoice(); } };

//   const startVoiceCall = () => {
//     setScreen("voice");
//     setCallDuration(0);
//     timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
//     setTimeout(() => speakText("Hi! I'm the MakeWithUs AI. How can I help you today?"), 800);
//   };

//   const fmt = (s: number) =>
//     `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

//   // ── STREAMING API CALL ─────────────────────────────────────────────────────
//   // ✅ Uses Gemini free API with streaming — first token in ~300ms
//   async function callAPIStreaming(
//     msgs: Message[],
//     onToken: (token: string) => void,
//     onDone:  (intent: string) => void
//   ): Promise<void> {
//     // Cancel any previous in-flight request
//     if (abortRef.current) abortRef.current.abort();
//     abortRef.current = new AbortController();

//     try {
//       const res = await fetch("/api/chat", {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify({ messages: msgs }),
//         signal:  abortRef.current.signal,
//       });

//       if (!res.ok || !res.body) {
//         const data = await res.json().catch(() => ({ error: "API error" }));
//         throw new Error(data.error || "API error");
//       }

//       const reader  = res.body.getReader();
//       const decoder = new TextDecoder();
//       let   buffer  = "";
//       let   intent  = "info";

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         buffer += decoder.decode(value, { stream: true });
//         const lines = buffer.split("\n");
//         buffer = lines.pop() ?? "";

//         for (const line of lines) {
//           const trimmed = line.trim();
//           if (!trimmed.startsWith("data:")) continue;
//           const data = trimmed.slice(5).trim();
//           if (data === "[DONE]") { onDone(intent); return; }
//           try {
//             const parsed = JSON.parse(data);
//             if (parsed.token) onToken(parsed.token);
//             if (parsed.intent) intent = parsed.intent;
//           } catch { /* incomplete chunk */ }
//         }
//       }
//       onDone(intent);
//     } catch (err: unknown) {
//       if (err instanceof Error && err.name === "AbortError") return; // cancelled
//       throw err;
//     }
//   }

//   // ── Send from CHAT screen (with streaming display) ─────────────────────────
//   const sendMessage = async (text?: string) => {
//     const msg = (text ?? input).trim();
//     if (!msg || isSending) return;

//     setLastUserMsg(msg);
//     const updated = [...messages, { role: "user" as const, content: msg }];
//     setMessages(updated);
//     setInput("");
//     setIsSending(true);
//     setIsTyping(true);
//     setTimeout(() => {
//   inputRef.current?.focus({
//     preventScroll: true,
//   });
// }, 50);

//     // Add empty assistant message — we'll fill it token by token
//     setMessages(p => [...p, { role: "assistant", content: "" }]);
//     setIsTyping(false);
//     setIsStreaming(true);

//     let detectedIntent = "info";

//     try {
//       await callAPIStreaming(
//         updated,
//         // onToken — append each token to last message
//         (token: string) => {
//           setMessages(p => {
//             const copy = [...p];
//             const last = copy[copy.length - 1];
//             if (last.role === "assistant") {
//               copy[copy.length - 1] = { ...last, content: last.content + token };
//             }
//             return copy;
//           });
//         },
//         // onDone — streaming finished
//         (intent: string) => {
//           detectedIntent = intent;
//         }
//       );
//     } catch {
//       setMessages(p => {
//         const copy = [...p];
//         copy[copy.length - 1] = { role: "assistant", content: "⚠️ Cannot connect. Check your API key." };
//         return copy;
//       });
//     } finally {
//       setIsSending(false);
//       setIsStreaming(false);
//     }

//     if (detectedIntent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
//     // setTimeout(() => inputRef.current?.focus(), 50);
//   };

//   // ── Send from VOICE screen (collect full reply then speak) ─────────────────
//   const sendMessageVoice = async (text: string) => {
//     const msg = text.trim();
//     if (!msg || isSendingRef.current) return;

//     stopSpeakingNow();
//     setLastUserMsg(msg);
//     setVoiceStatus("Thinking...");

//     const updated = [...messagesRef.current, { role: "user" as const, content: msg }];
//     setMessages((prev) => [
//   ...prev,
//   {
//     role: "user",
//     content: msg,
//   },
// ]);
//     setIsSending(true);
//     setIsTyping(true);

//     // Add empty assistant message
//     setMessages(p => [...p, { role: "assistant", content: "" }]);
//     setIsTyping(false);

//     let fullReply      = "";
//     let detectedIntent = "info";

//     try {
//       await callAPIStreaming(
//         updated,
//         (token: string) => {
//           fullReply += token;
//           // Update display in real time
//           setMessages(p => {
//             const copy = [...p];
//             const last = copy[copy.length - 1];
//             if (last.role === "assistant") {
//               copy[copy.length - 1] = { ...last, content: fullReply };
//             }
//             return copy;
//           });
//         },
//         (intent: string) => { detectedIntent = intent; }
//       );
//     } catch {
//       fullReply = "I couldn't connect. Please check your API key.";
//       setMessages(p => {
//         const copy = [...p];
//         copy[copy.length - 1] = { role: "assistant", content: "⚠️ " + fullReply };
//         return copy;
//       });
//     } finally {
//       setIsSending(false);
//     }

//     // Speak the full collected reply
//     if (fullReply && !fullReply.startsWith("⚠️")) speakText(fullReply);
//     if (detectedIntent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
//   };

//   const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
//   };

//   const handleLeadSuccess = (name: string) => {
//     setLeadSent(true); setShowLead(false);
//     const m = `Great, ${name}! Opening WhatsApp now. Our team will reply shortly. 🙌`;
//     setMessages(p => [...p, { role: "assistant", content: m }]);
//     if (screen === "voice") speakText(m);
//   };

//   const handleLeadDismiss = () => {
//     setShowLead(false);
//     const m = "No worries! Feel free to ask me anything else.";
//     setMessages(p => [...p, { role: "assistant", content: m }]);
//     if (screen === "voice") speakText(m);
//   };

//   const clearChat = () => {
//     if (abortRef.current) abortRef.current.abort();
//     setMessages([]); setShowLead(false); setLeadSent(false); setLastUserMsg("");
//     sessionStorage.removeItem("mwu_msgs");
//   };

//   const openWidget  = () => { setIsOpen(true); setScreen("home"); };
//   const closeWidget = () => {
//     if (abortRef.current) abortRef.current.abort();
//     setIsOpen(false); stopListening(); stopSpeakingNow();
//     if (timerRef.current) clearInterval(timerRef.current);
//   };

//   const prompts = ["What services do you offer?", "Tell me about your pricing", "How do I get started?"];

//   // ── Shared Header ──────────────────────────────────────────────────────────
//   const SharedHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
//     <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
//       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//         <button onClick={() => { stopListening(); stopSpeakingNow(); if (timerRef.current) clearInterval(timerRef.current); setScreen("home"); }}
//           style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: F }}>←</button>
//         <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff" }}>✦</div>
//         <div>
//           <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "14px", fontFamily: F }}>{title}</p>
//           {subtitle && <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "11px", fontFamily: F }}>{subtitle}</p>}
//         </div>
//       </div>
//       <div style={{ display: "flex", gap: "6px" }}>
//         {screen === "voice" && (
//           <button onClick={toggleMute}
//             style={{ background: isMuted ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             {isMuted
//               ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
//               : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
//             }
//           </button>
//         )}
//         <button onClick={closeWidget}
//           style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
//       </div>
//     </div>
//   );

//   // ── HOME SCREEN ────────────────────────────────────────────────────────────
//   const HomeScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "28px 20px 24px", flexShrink: 0 }}>
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//             <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff" }}>✦</div>
//             <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "16px", fontFamily: F }}>MakeWithUs AI</p>
//           </div>
//           <button onClick={closeWidget} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
//         </div>
//         <p style={{ margin: 0, color: "#fff", fontSize: "22px", fontWeight: 700 }}>Hi there! 👋</p>
//         <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>Let&apos;s get you started</p>
//       </div>

//       <div style={{ flex: 1, background: C.bg, padding: "16px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
//         {[
//           { label: "Start chat",       sub: "Chat with our AI assistant",  hc: C.accentL, iBg: "rgba(124,58,237,0.15)", hide: false,   onClick: () => setScreen("chat"),  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
//           { label: "Start voice call", sub: "Speak — AI replies by voice", hc: C.accentL, iBg: "rgba(124,58,237,0.15)", hide: !voiceOk, onClick: startVoiceCall,           icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> },
//           { label: "Call us",          sub: "Talk to a real person",       hc: C.wa,      iBg: "rgba(37,211,102,0.12)", hide: false,   onClick: () => setScreen("call"),  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.wa} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
//         ].filter(r => !r.hide).map(row => (
//           <button key={row.label} onClick={row.onClick}
//             style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", cursor: "pointer", width: "100%", fontFamily: F, transition: "border-color 0.15s" }}
//             onMouseEnter={e => (e.currentTarget.style.borderColor = row.hc)}
//             onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//             <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
//               <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: row.iBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.icon}</div>
//               <div style={{ textAlign: "left" }}>
//                 <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: F }}>{row.label}</p>
//                 <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>{row.sub}</p>
//               </div>
//             </div>
//             <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
//           </button>
//         ))}

//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
//           style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "12px", textDecoration: "none", transition: "border-color 0.15s" }}
//           onMouseEnter={e => (e.currentTarget.style.borderColor = C.wa)}
//           onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(37,211,102,0.25)")}>
//           <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
//             <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(37,211,102,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.wa }}><WaIcon size={20}/></div>
//             <div>
//               <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: F }}>WhatsApp us</p>
//               <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>Message us directly</p>
//             </div>
//           </div>
//           <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
//         </a>
//       </div>

//       <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── CHAT SCREEN ────────────────────────────────────────────────────────────
//   const ChatScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader title="MakeWithUs AI" subtitle={isTyping ? "Typing..." : isStreaming ? "Generating..." : "Online · Gemini Flash"} />

//       <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: C.bg }}>
//         {messages.length === 0 && (
//           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "11px" }}>
//             <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "#fff" }}>✦</div>
//             <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: C.white, fontFamily: F }}>Hey! How can I help you?</p>
//             <p style={{ margin: 0, fontSize: "13px", color: C.muted, textAlign: "center", lineHeight: 1.6, fontFamily: F }}>Ask about services, pricing,<br/>or how we can grow your business.</p>
//             <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%", marginTop: "4px" }}>
//               {prompts.map(p => (
//                 <button key={p} onClick={() => sendMessage(p)}
//                   style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px 14px", fontSize: "13px", cursor: "pointer", color: C.text, textAlign: "left", fontFamily: F, transition: "border-color 0.15s" }}
//                   onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
//                   onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>{p}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {messages.map((msg, i) => (
//           <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
//             {msg.role === "assistant" && (
//               <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>✦</div>
//             )}
//             <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: msg.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentL})` : C.surface, color: msg.role === "user" ? "#fff" : C.text, fontSize: "13px", lineHeight: "1.65", fontFamily: F, border: msg.role === "assistant" ? `1px solid ${C.border}` : "none", whiteSpace: "pre-wrap", minHeight: "20px" }}>
//               {msg.content}
//               {/* ✅ Blinking cursor while streaming this message */}
//               {msg.role === "assistant" && isStreaming && i === messages.length - 1 && (
//                 <span style={{ display: "inline-block", width: "2px", height: "14px", background: C.accentL, marginLeft: "2px", verticalAlign: "middle", animation: "mwuCursor 0.8s ease-in-out infinite" }}/>
//               )}
//             </div>
//           </div>
//         ))}

//         {isTyping && (
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0 }}>✦</div>
//             <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 3px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: "4px", alignItems: "center" }}>
//               {[0,1,2].map(n => <span key={n} style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}
//             </div>
//           </div>
//         )}

//         {showLead && !leadSent && <LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg}/>}
//         <div ref={messagesEndRef}/>
//       </div>

//       <div style={{ padding: "12px 14px", background: C.header, borderTop: `1px solid ${C.border}`, display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
//         {voiceOk && (
//           <button onClick={toggleChatMic}
//             style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: isListening ? "rgba(239,68,68,0.85)" : "rgba(124,58,237,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s", animation: isListening ? "mwuPulse 1.2s ease-in-out infinite" : "none" }}>
//             {isListening
//               ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
//               : <svg width="16" height="16" viewBox="0 0 24 24" fill={C.accentL}><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={C.accentL} strokeWidth="2" fill="none" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="23" x2="16" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round"/></svg>
//             }
//           </button>
//         )}
//         <input
//   ref={inputRef}
//   type="text"
//   value={input}
//         // autoFocus
//           onChange={e => setInput(() => e.target.value)} onKeyDown={handleKey}
//           placeholder={isListening ? "🎤 Listening..." : isStreaming ? "Wait for reply..." : "Ask anything..."}
//           autoComplete="off"
//           style={{ flex: 1, border: `1px solid ${isListening ? "rgba(239,68,68,0.5)" : C.border}`, borderRadius: "22px", padding: "9px 15px", fontSize: "13px", outline: "none", background: C.input, color: C.white, fontFamily: F, transition: "border-color 0.15s" }}
//           onFocus={e => (e.currentTarget.style.borderColor = C.accentL)}
//           onBlur={e  => (e.currentTarget.style.borderColor = isListening ? "rgba(239,68,68,0.5)" : C.border)}
//         />
//         <button onClick={() => sendMessage()} disabled={isSending || !input.trim()}
//           style={{ width: "36px", height: "36px", borderRadius: "50%", background: isSending || !input.trim() ? "rgba(124,58,237,0.25)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: isSending || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: "#fff", flexShrink: 0 }}>➤</button>
//       </div>

//       {isListening && <div style={{ background: "rgba(239,68,68,0.12)", borderTop: "1px solid rgba(239,68,68,0.2)", padding: "6px 14px", fontSize: "11px", color: "#f87171", textAlign: "center", flexShrink: 0 }}>🎤 Listening... tap mic to stop</div>}

//       <div style={{ background: C.header, padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", color: C.wa, fontSize: "11px", textDecoration: "none", fontFamily: F }}><WaIcon size={12}/> WhatsApp</a>
//         <button onClick={clearChat} style={{ background: "none", border: "none", color: C.muted, fontSize: "11px", cursor: "pointer", fontFamily: F }}>Clear chat</button>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>Gemini Flash</span></p>
//       </div>
//     </div>
//   );

//   // ── VOICE SCREEN ───────────────────────────────────────────────────────────
//   const VoiceScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader title="Voice call" subtitle={isMuted ? "🔇 AI muted" : isSpeaking ? "🔊 AI speaking..." : isListening ? "🎤 Listening..." : isSending ? "⏳ Thinking..." : voiceStatus}/>
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "22px", padding: "28px" }}>
//         <div style={{ position: "relative" }}>
//           {(isListening || isSpeaking) && <>
//             <div style={{ position: "absolute", inset: "-16px", borderRadius: "50%", border: `2px solid ${isSpeaking ? C.accentL : "#ef4444"}`, opacity: 0.35, animation: "voicePulse1 2s ease-out infinite" }}/>
//             <div style={{ position: "absolute", inset: "-30px", borderRadius: "50%", border: `2px solid ${isSpeaking ? C.accentL : "#ef4444"}`, opacity: 0.18, animation: "voicePulse2 2s ease-out infinite 0.4s" }}/>
//           </>}
//           <div style={{ width: "92px", height: "92px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "38px", color: "#fff", position: "relative", zIndex: 1 }}>✦</div>
//         </div>

//         <div style={{ textAlign: "center" }}>
//           <p style={{ margin: 0, color: C.white, fontSize: "18px", fontWeight: 600, fontFamily: F }}>MakeWithUs AI</p>
//           <p style={{ margin: "5px 0 0", fontSize: "13px", color: isSpeaking ? C.accentL : isListening ? "#f87171" : C.muted, fontFamily: F }}>
//             {isMuted ? "🔇 AI is muted" : isSpeaking ? "🔊 AI is speaking..." : isListening ? "🎤 Listening to you..." : isSending ? "⏳ Thinking..." : "Tap mic to speak"}
//           </p>
//           <p style={{ margin: "4px 0 0", color: C.muted, fontSize: "12px", fontFamily: "monospace" }}>{fmt(callDuration)}</p>
//         </div>

//         {messages.length > 0 && messages[messages.length-1].role === "assistant" && messages[messages.length-1].content && (
//           <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "12px 16px", width: "100%", maxHeight: "90px", overflowY: "auto" }}>
//             <p style={{ margin: 0, color: C.text, fontSize: "13px", lineHeight: 1.6, fontFamily: F }}>{messages[messages.length-1].content}</p>
//           </div>
//         )}

//         {isSending && <div style={{ display: "flex", gap: "5px" }}>{[0,1,2].map(n => <span key={n} style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}</div>}

//         <button onClick={toggleVoiceMic} disabled={isSending}
//           style={{ width: "74px", height: "74px", borderRadius: "50%", border: "none", cursor: isSending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: isListening ? "rgba(239,68,68,0.9)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, boxShadow: isListening ? "0 0 0 10px rgba(239,68,68,0.12)" : `0 0 0 10px rgba(124,58,237,0.12)`, transition: "all 0.2s", opacity: isSending ? 0.5 : 1 }}>
//           {isListening
//             ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>
//             : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
//           }
//         </button>

//         <p style={{ margin: 0, color: C.muted, fontSize: "12px", fontFamily: F }}>
//           {isListening ? "Tap to stop" : isSpeaking ? "Tap to interrupt" : "Tap to speak"}
//         </p>

//         {showLead && !leadSent && <div style={{ width: "100%" }}><LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg}/></div>}

//         <button onClick={() => setScreen("chat")}
//           style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, fontSize: "12px", padding: "6px 18px", borderRadius: "20px", cursor: "pointer", fontFamily: F }}
//           onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
//           onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//           Switch to chat →
//         </button>
//       </div>
//     </div>
//   );

//   // ── CALL SCREEN ────────────────────────────────────────────────────────────
//   const CallScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader title="Call us" subtitle="Talk to a real person"/>
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "20px", padding: "30px" }}>
//         <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", border: `2px solid ${C.wa}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.wa} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
//         </div>
//         <div style={{ textAlign: "center" }}>
//           <p style={{ margin: "0 0 6px", color: C.muted, fontSize: "13px" }}>Call us directly at</p>
//           <a href={`tel:${PHONE_DIALABLE}`} style={{ color: C.white, fontSize: "24px", fontWeight: 700, textDecoration: "none", fontFamily: F }}>{PHONE_NUMBER}</a>
//           <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "12px" }}>Mon – Sat, 10am – 7pm IST</p>
//         </div>
//         <a href={`tel:${PHONE_DIALABLE}`} style={{ display: "flex", alignItems: "center", gap: "8px", background: C.wa, borderRadius: "12px", padding: "14px 32px", color: "#fff", fontSize: "15px", fontWeight: 600, textDecoration: "none", fontFamily: F }}>
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
//           Tap to call
//         </a>
//         <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
//           <div style={{ flex: 1, height: "1px", background: C.border }}/><p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>or</p><div style={{ flex: 1, height: "1px", background: C.border }}/>
//         </div>
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
//           style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "12px", padding: "12px 24px", color: C.wa, fontSize: "14px", fontWeight: 500, textDecoration: "none", width: "100%", justifyContent: "center", boxSizing: "border-box", fontFamily: F }}>
//           <WaIcon size={16}/> Message on WhatsApp
//         </a>
//       </div>
//       <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── MAIN RENDER ────────────────────────────────────────────────────────────
//   return (
//     <>
//       <link rel="preconnect" href="https://fonts.googleapis.com"/>
//       <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
//       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>

//       <ProactiveHint onOpen={openWidget}/>

//       <button onClick={isOpen ? closeWidget : openWidget} aria-label="Toggle chat"
//         style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(124,58,237,0.5)", transition: "transform 0.2s", fontSize: "22px", color: "#fff" }}
//         onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)")}
//         onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}>
//         {isOpen ? "✕" : "✦"}
//       </button>

//       {isOpen && (
//         <div style={{ fontFamily: F, position: "fixed", bottom: "92px", right: "24px", zIndex: 9998, width: "380px", height: "590px", borderRadius: "20px", background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" }}>
//           {screen === "home"  && <HomeScreen/>}
//           {screen === "chat"  && <ChatScreen/>}
//           {screen === "voice" && <VoiceScreen/>}
//           {screen === "call"  && <CallScreen/>}
//         </div>
//       )}

//       <style>{`
//         @keyframes mwuBounce   { 0%,100%{transform:translateY(0);opacity:.4}  50%{transform:translateY(-4px);opacity:1} }
//         @keyframes mwuPulse    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
//         @keyframes voicePulse1 { 0%{transform:scale(1);opacity:.35} 100%{transform:scale(1.6);opacity:0} }
//         @keyframes voicePulse2 { 0%{transform:scale(1);opacity:.18} 100%{transform:scale(1.9);opacity:0} }
//         @keyframes mwuCursor   { 0%,100%{opacity:1} 50%{opacity:0} }
//       `}</style>
//     </>
//   );
// }

// "use client";
// import { useState, useEffect, useRef, useCallback } from "react";
// import ProactiveHint from "./ProactiveHint";
// import LeadForm from "./LeadForm";

// interface Message { role: "user" | "assistant"; content: string; }
// type Screen = "home" | "chat" | "voice" | "call";

// const WHATSAPP_NUMBER = "916395428620";
// const PHONE_NUMBER    = "+91 63954 28620";
// const PHONE_DIALABLE  = "916395428620";
// const WHATSAPP_BASE   = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I found you through MakeWithUs and I'd like to know more.")}`;
// const F               = "'Inter','Segoe UI',system-ui,-apple-system,Arial,sans-serif";

// const C = {
//   bg:      "#1a1a2e",
//   surface: "#16213e",
//   header:  "#12122a",
//   input:   "#0d0d1f",
//   accent:  "#7c3aed",
//   accentL: "#8b5cf6",
//   white:   "#ffffff",
//   text:    "rgba(255,255,255,0.88)",
//   muted:   "rgba(255,255,255,0.55)",
//   border:  "rgba(124,58,237,0.25)",
//   wa:      "#25D366",
// };

// const PAGE_SESSION = Math.random().toString(36).slice(2);

// declare global {
//   interface Window {
//     SpeechRecognition: new () => SpeechRecognition;
//     webkitSpeechRecognition: new () => SpeechRecognition;
//   }
// }

// const WaIcon = ({ size = 14 }: { size?: number }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
//     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
//   </svg>
// );

// export default function ChatWidget() {
//   const [isOpen,       setIsOpen]       = useState(false);
//   const [screen,       setScreen]       = useState<Screen>("home");
//   const [messages,     setMessages]     = useState<Message[]>([]);

//   // ✅ FIX 1: input state controlled properly — no functional updater on onChange
//   const [input,        setInput]        = useState("");
//   const [isSending,    setIsSending]    = useState(false);
//   const [isTyping,     setIsTyping]     = useState(false);
//   const [isStreaming,  setIsStreaming]  = useState(false);
//   const [isListening,  setIsListening]  = useState(false);
//   const [isSpeaking,   setIsSpeaking]   = useState(false);
//   const [voiceOk,      setVoiceOk]      = useState(false);
//   const [isMuted,      setIsMuted]      = useState(false);
//   const [voiceStatus,  setVoiceStatus]  = useState("Tap the mic to speak");
//   const [callDuration, setCallDuration] = useState(0);
//   const [showLead,     setShowLead]     = useState(false);
//   const [leadSent,     setLeadSent]     = useState(false);
//   const [lastUserMsg,  setLastUserMsg]  = useState("");

//   const messagesEndRef  = useRef<HTMLDivElement>(null);
//   const messagesBoxRef  = useRef<HTMLDivElement>(null); // ✅ FIX 2: scroll container ref
//   const inputRef        = useRef<HTMLInputElement>(null);
//   const recognitionRef  = useRef<SpeechRecognition | null>(null);
//   const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
//   const abortRef        = useRef<AbortController | null>(null);
//   const isStreamingRef  = useRef(false); // ✅ FIX 2: track streaming without re-render scroll

//   const screenRef      = useRef<Screen>("home");
//   const isMutedRef     = useRef(false);
//   const isSpeakingRef  = useRef(false);
//   const isSendingRef   = useRef(false);
//   const messagesRef    = useRef<Message[]>([]);

//   useEffect(() => { screenRef.current     = screen;     }, [screen]);
//   useEffect(() => { isMutedRef.current    = isMuted;    }, [isMuted]);
//   useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
//   useEffect(() => { isSendingRef.current  = isSending;  }, [isSending]);
//   useEffect(() => { messagesRef.current   = messages;   }, [messages]);
//   useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);

//   // ── Browser capability check ──────────────────────────────────────────────
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if (window.SpeechRecognition || window.webkitSpeechRecognition) setVoiceOk(true);
//     if (window.speechSynthesis) {
//       window.speechSynthesis.getVoices();
//       window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
//     }
//   }, []);

//   // ── Session management ────────────────────────────────────────────────────
//   useEffect(() => {
//     const last = sessionStorage.getItem("mwu_session");
//     if (last !== PAGE_SESSION) {
//       sessionStorage.setItem("mwu_session", PAGE_SESSION);
//       sessionStorage.removeItem("mwu_msgs");
//       setMessages([]);
//     } else {
//       try {
//         const s = sessionStorage.getItem("mwu_msgs");
//         if (s) setMessages(JSON.parse(s));
//       } catch { setMessages([]); }
//     }
//   }, []);

//   useEffect(() => {
//     if (messages.length > 0)
//       sessionStorage.setItem("mwu_msgs", JSON.stringify(messages));
//   }, [messages]);

//   // ✅ FIX 2: Smart scroll — only scroll when NEW message added, not on every token
//   const lastMsgCountRef = useRef(0);
//   // useEffect(() => {
//   //   const count = messages.length;
//   //   // Only scroll to bottom when a new message is added (not token-by-token updates)
//   //   if (count > lastMsgCountRef.current) {
//   //     lastMsgCountRef.current = count;
//   //     setTimeout(() => {
//   //       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   //     }, 50);
//   //   }
//   // }, [messages]);
//   useEffect(() => {
//   if (!isSending) {
//     messagesEndRef.current?.scrollIntoView({
//       behavior: "smooth",
//       block: "end",
//     });
//   }
// }, [messages.length, showLead]);

//   // Scroll when show lead changes
//   useEffect(() => {
//     if (showLead) {
//       setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
//     }
//   }, [showLead]);

//   // ✅ FIX 1: Focus input correctly — only when screen opens, not during streaming
//   // useEffect(() => {
//   //   if (isOpen && screen === "chat") {
//   //     setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 200);
//   //   }
//   // }, [isOpen, screen]);

//   useEffect(() => {
//   if (isOpen && screen === "chat") {
//     requestAnimationFrame(() => {
//       inputRef.current?.focus({
//         preventScroll: true,
//       });
//     });
//   }
// }, [isOpen, screen]);
//   // Cleanup voice when leaving voice screen
//   useEffect(() => {
//     if (screen !== "voice") {
//       stopListening();
//       stopSpeakingNow();
//       if (timerRef.current) clearInterval(timerRef.current);
//       setCallDuration(0);
//       setVoiceStatus("Tap the mic to speak");
//       setIsSpeaking(false);
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [screen]);

//   // ── TTS ───────────────────────────────────────────────────────────────────
//   function stopSpeakingNow() {
//     try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch { /* ignore */ }
//     setIsSpeaking(false);
//     isSpeakingRef.current = false;
//   }

//   function speakText(text: string) {
//     if (typeof window === "undefined" || !window.speechSynthesis) return;
//     if (isMutedRef.current) return;
//     try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
//     setIsSpeaking(false);

//     setTimeout(() => {
//       if (isMutedRef.current) return;
//       let utt: SpeechSynthesisUtterance;
//       try { utt = new SpeechSynthesisUtterance(text); } catch { return; }

//       utt.lang = "en-US"; utt.rate = 1.0; utt.pitch = 1.0; utt.volume = 1.0;

//       try {
//         const voices    = window.speechSynthesis.getVoices();
//         const preferred = voices.find(v =>
//           v.lang.startsWith("en") &&
//           (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen"))
//         ) || voices.find(v => v.lang.startsWith("en") && !v.name.includes("Zira"));
//         if (preferred) utt.voice = preferred;
//       } catch { /* use default */ }

//       utt.onstart = () => {
//         setIsSpeaking(true);
//         isSpeakingRef.current = true;
//         setVoiceStatus("AI is speaking...");
//       };
//       utt.onend = () => {
//         setIsSpeaking(false);
//         isSpeakingRef.current = false;
//         setVoiceStatus("Tap the mic to speak");
//         if (screenRef.current === "voice" && !isMutedRef.current) {
//           setTimeout(() => {
//             if (screenRef.current === "voice" && !isSpeakingRef.current && !isSendingRef.current)
//               startListeningVoice();
//           }, 600);
//         }
//       };
//       utt.onerror = (_e: SpeechSynthesisErrorEvent) => {
//         setIsSpeaking(false);
//         isSpeakingRef.current = false;
//         setVoiceStatus("Tap the mic to speak");
//       };

//       try { window.speechSynthesis.speak(utt); } catch { setIsSpeaking(false); }
//     }, 150);
//   }

//   const toggleMute = () => {
//     const next = !isMuted;
//     setIsMuted(next);
//     isMutedRef.current = next;
//     if (next) stopSpeakingNow();
//   };

//   // ── Speech Recognition ────────────────────────────────────────────────────
//   function startListening(onTranscript?: (t: string) => void) {
//     if (!voiceOk || isSpeakingRef.current) return;
//     try {
//       if (recognitionRef.current) {
//         recognitionRef.current.onend   = null;
//         recognitionRef.current.onerror = null;
//         recognitionRef.current.stop();
//       }
//     } catch { /* ignore */ }

//     const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
//     const rec = new SR();
//     recognitionRef.current = rec;
//     rec.lang            = "en-IN";
//     rec.interimResults  = false;
//     rec.maxAlternatives = 1;
//     rec.continuous      = false;

//     rec.onstart  = () => { setIsListening(true); setVoiceStatus("Listening..."); };
//     rec.onresult = (e: SpeechRecognitionEvent) => {
//       const t = e.results[0][0].transcript.trim();
//       if (!t) return;
//       if (onTranscript) {
//         onTranscript(t);
//       } 
//       // else {
//       //   // ✅ FIX 1: Directly set value, don't use functional updater for voice transcript
//       //   setInput(t);
//       //   setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
//       // }
//     };
//     rec.onerror = (e: SpeechRecognitionErrorEvent) => {
//       if (e.error !== "no-speech" && e.error !== "aborted") console.warn("STT:", e.error);
//       setIsListening(false);
//       setVoiceStatus("Tap the mic to speak");
//     };
//     rec.onend = () => { setIsListening(false); setVoiceStatus("Tap the mic to speak"); };
//     try { rec.start(); } catch { setIsListening(false); }
//   }

//   function startListeningVoice() { startListening(t => sendMessageVoice(t)); }

//   function stopListening() {
//     try {
//       if (recognitionRef.current) {
//         recognitionRef.current.onend   = null;
//         recognitionRef.current.onerror = null;
//         recognitionRef.current.stop();
//       }
//     } catch { /* ignore */ }
//     setIsListening(false);
//   }

//   const toggleChatMic  = () => { if (isListening) stopListening(); else startListening(); };
//   const toggleVoiceMic = () => {
//     if (isListening) { stopListening(); }
//     else { stopSpeakingNow(); startListeningVoice(); }
//   };

//   const startVoiceCall = () => {
//     setScreen("voice");
//     setCallDuration(0);
//     timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
//     setTimeout(() => speakText("Hi! I'm the MakeWithUs AI. How can I help you today?"), 800);
//   };

//   const fmt = (s: number) =>
//     `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

//   // ── Streaming API Call ────────────────────────────────────────────────────
//   const callAPIStreaming = useCallback(async (
//     msgs: Message[],
//     onToken: (token: string) => void,
//     onDone:  (intent: string) => void
//   ): Promise<void> => {
//     if (abortRef.current) abortRef.current.abort();
//     abortRef.current = new AbortController();

//     try {
//       const res = await fetch("/api/chat", {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify({ messages: msgs }),
//         signal:  abortRef.current.signal,
//       });

//       if (!res.ok || !res.body) {
//         const data = await res.json().catch(() => ({ error: "API error" }));
//         throw new Error(data.error || "API error");
//       }

//       const reader  = res.body.getReader();
//       const decoder = new TextDecoder();
//       let   buffer  = "";
//       let   intent  = "info";

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         buffer += decoder.decode(value, { stream: true });
//         const lines = buffer.split("\n");
//         buffer = lines.pop() ?? "";

//         for (const line of lines) {
//           const trimmed = line.trim();
//           if (!trimmed.startsWith("data:")) continue;
//           const data = trimmed.slice(5).trim();
//           if (data === "[DONE]") { onDone(intent); return; }
//           try {
//             const parsed = JSON.parse(data);
//             if (parsed.token) onToken(parsed.token);
//             if (parsed.intent) intent = parsed.intent;
//           } catch { /* incomplete chunk */ }
//         }
//       }
//       onDone(intent);
//     } catch (err: unknown) {
//       if (err instanceof Error && err.name === "AbortError") return;
//       throw err;
//     }
//   }, []);

//   // ── Send from CHAT screen ─────────────────────────────────────────────────
//   // ✅ FIX 3: Streaming response — accumulate in ref, set state in batch via requestAnimationFrame
//   const sendMessage = useCallback(async (text?: string) => {
//     const msg = (text ?? input).trim();
//     if (!msg || isSending) return;

//     setLastUserMsg(msg);
//     const userMsg: Message = { role: "user", content: msg };

//     // Add user message + empty assistant placeholder
//     setMessages(prev => [...prev, userMsg, { role: "assistant", content: "" }]);
//     setInput(""); // ✅ Clear input immediately
//     setIsSending(true);
//     setIsTyping(false);
//     setIsStreaming(true);
//     isStreamingRef.current = true;

//     // Focus input after clearing — use preventScroll to avoid jump
//     setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);

//     let accumulated = "";
//     let detectedIntent = "info";
//     let rafId: number | null = null;

//     const updatedMsgs = [...messagesRef.current, userMsg];

//     try {
//       await callAPIStreaming(
//         updatedMsgs,
//         // ✅ FIX 3: Batch token updates using requestAnimationFrame — smooth like ChatGPT
//         (token: string) => {
//           accumulated += token;
//           if (rafId !== null) return; // skip if frame already scheduled
//           rafId = requestAnimationFrame(() => {
//             rafId = null;
//             const snapshot = accumulated;
//             setMessages(prev => {
//               const copy = [...prev];
//               const lastIdx = copy.length - 1;
//               if (copy[lastIdx]?.role === "assistant") {
//                 copy[lastIdx] = { role: "assistant", content: snapshot };
//               }
//               return copy;
//             });
//           });
//         },
//         (intent: string) => {
//           detectedIntent = intent;
//         }
//       );
//     } catch {
//       setMessages(prev => {
//         const copy = [...prev];
//         const lastIdx = copy.length - 1;
//         if (copy[lastIdx]?.role === "assistant") {
//           copy[lastIdx] = { role: "assistant", content: "⚠️ Cannot connect. Check your API key in .env.local" };
//         }
//         return copy;
//       });
//     } finally {
//       // Flush any remaining accumulated text
//       if (rafId !== null) {
//         cancelAnimationFrame(rafId);
//         rafId = null;
//       }
//       if (accumulated) {
//         setMessages(prev => {
//           const copy = [...prev];
//           const lastIdx = copy.length - 1;
//           if (copy[lastIdx]?.role === "assistant" && copy[lastIdx].content !== accumulated) {
//             copy[lastIdx] = { role: "assistant", content: accumulated };
//           }
//           return copy;
//         });
//       }
//       setIsSending(false);
//       setIsStreaming(false);
//       isStreamingRef.current = false;
//     }

//     if (detectedIntent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [input, isSending, leadSent, callAPIStreaming]);

//   // ── Send from VOICE screen ────────────────────────────────────────────────
//   const sendMessageVoice = useCallback(async (text: string) => {
//     const msg = text.trim();
//     if (!msg || isSendingRef.current) return;

//     stopSpeakingNow();
//     setLastUserMsg(msg);
//     setVoiceStatus("Thinking...");

//     const userMsg: Message = { role: "user", content: msg };
//     const updatedMsgs = [...messagesRef.current, userMsg];

//     setMessages(prev => [...prev, userMsg, { role: "assistant", content: "" }]);
//     setIsSending(true);

//     let accumulated    = "";
//     let detectedIntent = "info";
//     let rafId: number | null = null;

//     try {
//       await callAPIStreaming(
//         updatedMsgs,
//         (token: string) => {
//           accumulated += token;
//           if (rafId !== null) return;
//           rafId = requestAnimationFrame(() => {
//             rafId = null;
//             const snapshot = accumulated;
//             setMessages(prev => {
//               const copy = [...prev];
//               const lastIdx = copy.length - 1;
//               if (copy[lastIdx]?.role === "assistant") {
//                 copy[lastIdx] = { role: "assistant", content: snapshot };
//               }
//               return copy;
//             });
//           });
//         },
//         (intent: string) => { detectedIntent = intent; }
//       );
//     } catch {
//       accumulated = "I couldn't connect. Please check your API key.";
//       setMessages(prev => {
//         const copy = [...prev];
//         const lastIdx = copy.length - 1;
//         if (copy[lastIdx]?.role === "assistant") {
//           copy[lastIdx] = { role: "assistant", content: "⚠️ " + accumulated };
//         }
//         return copy;
//       });
//     } finally {
//       if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
//       if (accumulated) {
//         setMessages(prev => {
//           const copy = [...prev];
//           const lastIdx = copy.length - 1;
//           if (copy[lastIdx]?.role === "assistant") {
//             copy[lastIdx] = { role: "assistant", content: accumulated };
//           }
//           return copy;
//         });
//       }
//       setIsSending(false);
//     }

//     if (accumulated && !accumulated.startsWith("⚠️")) speakText(accumulated);
//     if (detectedIntent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [leadSent, callAPIStreaming]);

//   // ✅ FIX 1: Simple controlled input handler — no functional updater
//   const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     setInput(e.target.value);
//   }, []);

//   const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   }, [sendMessage]);

//   const handleLeadSuccess = (name: string) => {
//     setLeadSent(true); setShowLead(false);
//     const m = `Great, ${name}! Opening WhatsApp now. Our team will reply shortly. 🙌`;
//     setMessages(p => [...p, { role: "assistant", content: m }]);
//     if (screen === "voice") speakText(m);
//   };

//   const handleLeadDismiss = () => {
//     setShowLead(false);
//     const m = "No worries! Feel free to ask me anything else.";
//     setMessages(p => [...p, { role: "assistant", content: m }]);
//     if (screen === "voice") speakText(m);
//   };

//   const clearChat = () => {
//     if (abortRef.current) abortRef.current.abort();
//     setMessages([]);
//     setShowLead(false);
//     setLeadSent(false);
//     setLastUserMsg("");
//     lastMsgCountRef.current = 0;
//     sessionStorage.removeItem("mwu_msgs");
//   };

//   const openWidget  = () => { setIsOpen(true); setScreen("home"); };
//   const closeWidget = () => {
//     if (abortRef.current) abortRef.current.abort();
//     setIsOpen(false);
//     stopListening();
//     stopSpeakingNow();
//     if (timerRef.current) clearInterval(timerRef.current);
//   };

//   const prompts = [
//     "What services do you offer?",
//     "Tell me about your pricing",
//     "How do I get started?",
//   ];

//   // ── Shared Header ─────────────────────────────────────────────────────────
//   const SharedHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
//     <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
//       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//         <button
//           onClick={() => {
//             stopListening(); stopSpeakingNow();
//             if (timerRef.current) clearInterval(timerRef.current);
//             setScreen("home");
//           }}
//           style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: F }}>
//           ←
//         </button>
//         <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff" }}>✦</div>
//         <div>
//           <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "14px", fontFamily: F }}>{title}</p>
//           {subtitle && <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "11px", fontFamily: F }}>{subtitle}</p>}
//         </div>
//       </div>
//       <div style={{ display: "flex", gap: "6px" }}>
//         {screen === "voice" && (
//           <button onClick={toggleMute}
//             style={{ background: isMuted ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             {isMuted
//               ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
//               : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
//             }
//           </button>
//         )}
//         <button onClick={closeWidget}
//           style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
//           ✕
//         </button>
//       </div>
//     </div>
//   );

//   // ── HOME SCREEN ───────────────────────────────────────────────────────────
//   const HomeScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "28px 20px 24px", flexShrink: 0 }}>
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//             <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff" }}>✦</div>
//             <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "16px", fontFamily: F }}>MakeWithUs AI</p>
//           </div>
//           <button onClick={closeWidget} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
//         </div>
//         <p style={{ margin: 0, color: "#fff", fontSize: "22px", fontWeight: 700 }}>Hi there! 👋</p>
//         <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>Let&apos;s get you started</p>
//       </div>

//       <div style={{ flex: 1, background: C.bg, padding: "16px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
//         {[
//           {
//             label: "Start chat", sub: "Chat with our AI assistant",
//             hc: C.accentL, iBg: "rgba(124,58,237,0.15)", hide: false,
//             onClick: () => setScreen("chat"),
//             icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
//           },
//           {
//             label: "Start voice call", sub: "Speak — AI replies by voice",
//             hc: C.accentL, iBg: "rgba(124,58,237,0.15)", hide: !voiceOk,
//             onClick: startVoiceCall,
//             icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
//           },
//           {
//             label: "Call us", sub: "Talk to a real person",
//             hc: C.wa, iBg: "rgba(37,211,102,0.12)", hide: false,
//             onClick: () => setScreen("call"),
//             icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.wa} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
//           },
//         ].filter(r => !r.hide).map(row => (
//           <button key={row.label} onClick={row.onClick}
//             style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", cursor: "pointer", width: "100%", fontFamily: F, transition: "border-color 0.15s" }}
//             onMouseEnter={e => (e.currentTarget.style.borderColor = row.hc)}
//             onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//             <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
//               <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: row.iBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.icon}</div>
//               <div style={{ textAlign: "left" }}>
//                 <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: F }}>{row.label}</p>
//                 <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>{row.sub}</p>
//               </div>
//             </div>
//             <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
//           </button>
//         ))}

//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
//           style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "12px", textDecoration: "none", transition: "border-color 0.15s" }}
//           onMouseEnter={e => (e.currentTarget.style.borderColor = C.wa)}
//           onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(37,211,102,0.25)")}>
//           <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
//             <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(37,211,102,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.wa }}><WaIcon size={20}/></div>
//             <div>
//               <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: F }}>WhatsApp us</p>
//               <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>Message us directly</p>
//             </div>
//           </div>
//           <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
//         </a>
//       </div>

//       <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── CHAT SCREEN ───────────────────────────────────────────────────────────
//   const ChatScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader
//         title="MakeWithUs AI"
//         subtitle={isTyping ? "Typing..." : isStreaming ? "Generating..." : "Online · AI Assistant"}
//       />

//       {/* ✅ FIX 2: overflow on this div only, not the whole widget */}
//       <div
//         ref={messagesBoxRef}
//         style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: C.bg }}
//       >
//         {messages.length === 0 && (
//           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "11px" }}>
//             <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "#fff" }}>✦</div>
//             <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: C.white, fontFamily: F }}>Hey! How can I help you?</p>
//             <p style={{ margin: 0, fontSize: "13px", color: C.muted, textAlign: "center", lineHeight: 1.6, fontFamily: F }}>
//               Ask about services, pricing,<br/>or how we can grow your business.
//             </p>
//             <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%", marginTop: "4px" }}>
//               {prompts.map(p => (
//                 <button key={p} onClick={() => sendMessage(p)}
//                   style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px 14px", fontSize: "13px", cursor: "pointer", color: C.text, textAlign: "left", fontFamily: F, transition: "border-color 0.15s" }}
//                   onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
//                   onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//                   {p}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {messages.map((msg, i) => (
//           <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
//             {msg.role === "assistant" && (
//               <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>✦</div>
//             )}
//             <div style={{
//               maxWidth: "78%", padding: "10px 14px",
//               borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
//               background: msg.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentL})` : C.surface,
//               color: msg.role === "user" ? "#fff" : C.text,
//               fontSize: "13px", lineHeight: "1.65", fontFamily: F,
//               border: msg.role === "assistant" ? `1px solid ${C.border}` : "none",
//               whiteSpace: "pre-wrap", minHeight: "20px", wordBreak: "break-word",
//             }}>
//               {msg.content}
//               {/* ✅ FIX 3: Blinking cursor only on last streaming message */}
//               {msg.role === "assistant" && isStreaming && i === messages.length - 1 && msg.content.length > 0 && (
//                 <span style={{ display: "inline-block", width: "2px", height: "13px", background: C.accentL, marginLeft: "2px", verticalAlign: "middle", animation: "mwuCursor 0.7s ease-in-out infinite" }}/>
//               )}
//             </div>
//           </div>
//         ))}

//         {isTyping && (
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0 }}>✦</div>
//             <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 3px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: "4px", alignItems: "center" }}>
//               {[0,1,2].map(n => (
//                 <span key={n} style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>
//               ))}
//             </div>
//           </div>
//         )}

//         {showLead && !leadSent && (
//           <LeadForm
//             whatsappNumber={WHATSAPP_NUMBER}
//             onSuccess={handleLeadSuccess}
//             onDismiss={handleLeadDismiss}
//             prefillNeed={lastUserMsg}
//           />
//         )}
//         <div ref={messagesEndRef} style={{ height: "1px" }}/>
//       </div>

//       {/* Input bar */}
//       <div style={{ padding: "12px 14px", background: C.header, borderTop: `1px solid ${C.border}`, display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
//         {voiceOk && (
//           <button onClick={toggleChatMic}
//             style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: isListening ? "rgba(239,68,68,0.85)" : "rgba(124,58,237,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s", animation: isListening ? "mwuPulse 1.2s ease-in-out infinite" : "none" }}>
//             {isListening
//               ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
//               : <svg width="16" height="16" viewBox="0 0 24 24" fill={C.accentL}><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={C.accentL} strokeWidth="2" fill="none" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="23" x2="16" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round"/></svg>
//             }
//           </button>
//         )}

//         {/* ✅ FIX 1: Correct controlled input — simple onChange, no autoFocus, no scroll */}
//         <input
//           ref={inputRef}
//           type="text"
//           value={input}
//           onChange={handleInputChange}
//           onKeyDown={handleKey}
//           placeholder={isListening ? "🎤 Listening..." : isStreaming ? "Please wait..." : "Ask anything..."}
//           autoComplete="off"
//           autoCorrect="off"
//           autoCapitalize="off"
//           spellCheck={false}
//           style={{
//             flex: 1,
//             border: `1px solid ${isListening ? "rgba(239,68,68,0.5)" : C.border}`,
//             borderRadius: "22px",
//             padding: "9px 15px",
//             fontSize: "13px",
//             outline: "none",
//             background: C.input,
//             color: C.white,
//             fontFamily: F,
//             transition: "border-color 0.15s",
//           }}
//           onFocus={e  => (e.currentTarget.style.borderColor = C.accentL)}
//           onBlur={e   => (e.currentTarget.style.borderColor = isListening ? "rgba(239,68,68,0.5)" : C.border)}
//         />

//         <button
//           onClick={() => sendMessage()}
//           disabled={isSending || !input.trim()}
//           style={{ width: "36px", height: "36px", borderRadius: "50%", background: isSending || !input.trim() ? "rgba(124,58,237,0.25)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: isSending || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: "#fff", flexShrink: 0 }}>
//           ➤
//         </button>
//       </div>

//       {isListening && (
//         <div style={{ background: "rgba(239,68,68,0.12)", borderTop: "1px solid rgba(239,68,68,0.2)", padding: "6px 14px", fontSize: "11px", color: "#f87171", textAlign: "center", flexShrink: 0 }}>
//           🎤 Listening... tap mic to stop
//         </div>
//       )}

//       <div style={{ background: C.header, padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", color: C.wa, fontSize: "11px", textDecoration: "none", fontFamily: F }}>
//           <WaIcon size={12}/> WhatsApp
//         </a>
//         <button onClick={clearChat} style={{ background: "none", border: "none", color: C.muted, fontSize: "11px", cursor: "pointer", fontFamily: F }}>Clear chat</button>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>AI Assistant</span></p>
//       </div>
//     </div>
//   );

//   // ── VOICE SCREEN ──────────────────────────────────────────────────────────
//   const VoiceScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader
//         title="Voice call"
//         subtitle={isMuted ? "🔇 AI muted" : isSpeaking ? "🔊 AI speaking..." : isListening ? "🎤 Listening..." : isSending ? "⏳ Thinking..." : voiceStatus}
//       />
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "22px", padding: "28px" }}>
//         <div style={{ position: "relative" }}>
//           {(isListening || isSpeaking) && (
//             <>
//               <div style={{ position: "absolute", inset: "-16px", borderRadius: "50%", border: `2px solid ${isSpeaking ? C.accentL : "#ef4444"}`, opacity: 0.35, animation: "voicePulse1 2s ease-out infinite" }}/>
//               <div style={{ position: "absolute", inset: "-30px", borderRadius: "50%", border: `2px solid ${isSpeaking ? C.accentL : "#ef4444"}`, opacity: 0.18, animation: "voicePulse2 2s ease-out infinite 0.4s" }}/>
//             </>
//           )}
//           <div style={{ width: "92px", height: "92px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "38px", color: "#fff", position: "relative", zIndex: 1 }}>✦</div>
//         </div>

//         <div style={{ textAlign: "center" }}>
//           <p style={{ margin: 0, color: C.white, fontSize: "18px", fontWeight: 600, fontFamily: F }}>MakeWithUs AI</p>
//           <p style={{ margin: "5px 0 0", fontSize: "13px", color: isSpeaking ? C.accentL : isListening ? "#f87171" : C.muted, fontFamily: F }}>
//             {isMuted ? "🔇 AI is muted" : isSpeaking ? "🔊 AI is speaking..." : isListening ? "🎤 Listening to you..." : isSending ? "⏳ Thinking..." : "Tap mic to speak"}
//           </p>
//           <p style={{ margin: "4px 0 0", color: C.muted, fontSize: "12px", fontFamily: "monospace" }}>{fmt(callDuration)}</p>
//         </div>

//         {messages.length > 0 && messages[messages.length-1].role === "assistant" && messages[messages.length-1].content && (
//           <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "12px 16px", width: "100%", maxHeight: "90px", overflowY: "auto" }}>
//             <p style={{ margin: 0, color: C.text, fontSize: "13px", lineHeight: 1.6, fontFamily: F }}>{messages[messages.length-1].content}</p>
//           </div>
//         )}

//         {isSending && (
//           <div style={{ display: "flex", gap: "5px" }}>
//             {[0,1,2].map(n => (
//               <span key={n} style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>
//             ))}
//           </div>
//         )}

//         <button
//           onClick={toggleVoiceMic}
//           disabled={isSending}
//           style={{ width: "74px", height: "74px", borderRadius: "50%", border: "none", cursor: isSending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: isListening ? "rgba(239,68,68,0.9)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, boxShadow: isListening ? "0 0 0 10px rgba(239,68,68,0.12)" : `0 0 0 10px rgba(124,58,237,0.12)`, transition: "all 0.2s", opacity: isSending ? 0.5 : 1 }}>
//           {isListening
//             ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>
//             : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
//           }
//         </button>

//         <p style={{ margin: 0, color: C.muted, fontSize: "12px", fontFamily: F }}>
//           {isListening ? "Tap to stop" : isSpeaking ? "Tap to interrupt" : "Tap to speak"}
//         </p>

//         {showLead && !leadSent && (
//           <div style={{ width: "100%" }}>
//             <LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg}/>
//           </div>
//         )}

//         <button
//           onClick={() => setScreen("chat")}
//           style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, fontSize: "12px", padding: "6px 18px", borderRadius: "20px", cursor: "pointer", fontFamily: F }}
//           onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
//           onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
//           Switch to chat →
//         </button>
//       </div>
//     </div>
//   );

//   // ── CALL SCREEN ───────────────────────────────────────────────────────────
//   const CallScreen = () => (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
//       <SharedHeader title="Call us" subtitle="Talk to a real person"/>
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "20px", padding: "30px" }}>
//         <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", border: `2px solid ${C.wa}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.wa} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
//         </div>
//         <div style={{ textAlign: "center" }}>
//           <p style={{ margin: "0 0 6px", color: C.muted, fontSize: "13px" }}>Call us directly at</p>
//           <a href={`tel:${PHONE_DIALABLE}`} style={{ color: C.white, fontSize: "24px", fontWeight: 700, textDecoration: "none", fontFamily: F }}>{PHONE_NUMBER}</a>
//           <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "12px" }}>Mon – Sat, 10am – 7pm IST</p>
//         </div>
//         <a href={`tel:${PHONE_DIALABLE}`}
//           style={{ display: "flex", alignItems: "center", gap: "8px", background: C.wa, borderRadius: "12px", padding: "14px 32px", color: "#fff", fontSize: "15px", fontWeight: 600, textDecoration: "none", fontFamily: F }}>
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
//           Tap to call
//         </a>
//         <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
//           <div style={{ flex: 1, height: "1px", background: C.border }}/>
//           <p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>or</p>
//           <div style={{ flex: 1, height: "1px", background: C.border }}/>
//         </div>
//         <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
//           style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "12px", padding: "12px 24px", color: C.wa, fontSize: "14px", fontWeight: 500, textDecoration: "none", width: "100%", justifyContent: "center", boxSizing: "border-box", fontFamily: F }}>
//           <WaIcon size={16}/> Message on WhatsApp
//         </a>
//       </div>
//       <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
//         <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
//       </div>
//     </div>
//   );

//   // ── MAIN RENDER ───────────────────────────────────────────────────────────
//   return (
//     <>
//       <link rel="preconnect" href="https://fonts.googleapis.com"/>
//       <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
//       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>

//       <ProactiveHint onOpen={openWidget}/>

//       <button
//         onClick={isOpen ? closeWidget : openWidget}
//         aria-label="Toggle chat"
//         style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(124,58,237,0.5)", transition: "transform 0.2s", fontSize: "22px", color: "#fff" }}
//         onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)")}
//         onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}>
//         {isOpen ? "✕" : "✦"}
//       </button>

//       {isOpen && (
//         <div style={{ fontFamily: F, position: "fixed", bottom: "92px", right: "24px", zIndex: 9998, width: "380px", height: "590px", borderRadius: "20px", background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" }}>
//           {screen === "home"  && <HomeScreen/>}
//           {screen === "chat"  && <ChatScreen/>}
//           {screen === "voice" && <VoiceScreen/>}
//           {screen === "call"  && <CallScreen/>}
//         </div>
//       )}

//       <style>{`
//         @keyframes mwuBounce   { 0%,100%{transform:translateY(0);opacity:.4}  50%{transform:translateY(-4px);opacity:1} }
//         @keyframes mwuPulse    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
//         @keyframes voicePulse1 { 0%{transform:scale(1);opacity:.35} 100%{transform:scale(1.6);opacity:0} }
//         @keyframes voicePulse2 { 0%{transform:scale(1);opacity:.18} 100%{transform:scale(1.9);opacity:0} }
//         @keyframes mwuCursor   { 0%,100%{opacity:1} 50%{opacity:0} }
//       `}</style>
//     </>
//   );
// }

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import ProactiveHint from "./ProactiveHint";
import LeadForm from "./LeadForm";

interface Message { role: "user" | "assistant"; content: string; }
type Screen = "home" | "chat" | "voice" | "call";

const WHATSAPP_NUMBER = "916395428620";
const PHONE_NUMBER    = "+91 63954 28620";
const PHONE_DIALABLE  = "916395428620";
const WHATSAPP_BASE   = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I found you through MakeWithUs and I'd like to know more.")}`;
const F               = "'Inter','Segoe UI',system-ui,-apple-system,Arial,sans-serif";

// const C = {
//   bg:      "#1a1a2e",
//   surface: "#16213e",
//   header:  "#12122a",
//   input:   "#0d0d1f",
//   accent:  "#7c3aed",
//   accentL: "#8b5cf6",
//   white:   "#ffffff",
//   text:    "rgba(255,255,255,0.88)",
//   muted:   "rgba(255,255,255,0.55)",
//   border:  "rgba(124,58,237,0.25)",
//   wa:      "#25D366",
// };
const C = {
  bg:      "#000000",
  surface: "#111111",
  header:  "#1a1a1a",
  input:   "#0a0a0a",
  accent:  "#000000",
  accentL: "#ffffff",
  white:   "#ffffff",
  text:    "rgba(255,255,255,0.92)",
  muted:   "rgba(255,255,255,0.60)",
  border:  "rgba(255,255,255,0.18)",
  wa:      "#ffffff",
};
const PAGE_SESSION = Math.random().toString(36).slice(2);

// declare global {
//   interface Window {
//     SpeechRecognition: new () => SpeechRecognition;
//     webkitSpeechRecognition: new () => SpeechRecognition;
//   }
// }
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
const WaIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function ChatWidget() {

  const [isOpen,       setIsOpen]       = useState(false);
  const [screen,       setScreen]       = useState<Screen>("home");
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState("");
  const [isSending,    setIsSending]    = useState(false);
  const [isTyping,     setIsTyping]     = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [voiceOk,      setVoiceOk]      = useState(false);
  const [isMuted,      setIsMuted]      = useState(false);
  const [voiceStatus,  setVoiceStatus]  = useState("Tap the mic to speak");
  const [callDuration, setCallDuration] = useState(0);
  const [showLead,     setShowLead]     = useState(false);
  const [leadSent,     setLeadSent]     = useState(false);
  const [lastUserMsg,  setLastUserMsg]  = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  // ✅ FIX: track whether user is actively typing to prevent scroll stealing
  const isUserTypingRef = useRef(false);

  const screenRef      = useRef<Screen>("home");
  const isMutedRef     = useRef(false);
  const isSpeakingRef  = useRef(false);
  const isSendingRef   = useRef(false);
  const messagesRef    = useRef<Message[]>([]);

  useEffect(() => { screenRef.current    = screen;    }, [screen]);
  useEffect(() => { isMutedRef.current   = isMuted;   }, [isMuted]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isSendingRef.current  = isSending;  }, [isSending]);
  useEffect(() => { messagesRef.current   = messages;   }, [messages]);

  // ── Browser check ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.SpeechRecognition || window.webkitSpeechRecognition) setVoiceOk(true);
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }
  }, []);

  // ── Session management ────────────────────────────────────────────────────

  useEffect(() => {
  setMessages([]);
}, []);
  // useEffect(() => {
  //   const last = sessionStorage.getItem("mwu_session");
  //   if (last !== PAGE_SESSION) {
  //     sessionStorage.setItem("mwu_session", PAGE_SESSION);
  //     sessionStorage.removeItem("mwu_msgs");
  //     setMessages([]);
  //   } else {
  //     try { const s = sessionStorage.getItem("mwu_msgs"); if (s) setMessages(JSON.parse(s)); }
  //     catch { setMessages([]); }
  //   }
  // }, []);

  // useEffect(() => {
  //   if (messages.length > 0) sessionStorage.setItem("mwu_msgs", JSON.stringify(messages));
  // }, [messages]);

  // ✅ FIX ISSUE 1: Only scroll when user is NOT typing
  // Old code scrolled on every message change including while typing
  useEffect(() => {
    if (isUserTypingRef.current) return; // don't scroll while user types
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showLead]);

  // ✅ FIX ISSUE 1: Only focus input once when screen opens — not on every re-render
  // Old code had setTimeout focus inside sendMessage AND in useEffect with [isOpen, screen]
  // causing focus to be stolen repeatedly after every state change
  const didFocusOnOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && screen === "chat") {
      if (!didFocusOnOpenRef.current) {
        didFocusOnOpenRef.current = true;
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 150);
      }
    } else {
      didFocusOnOpenRef.current = false;
    }
  }, [isOpen, screen]);

  // Cleanup on leaving voice screen
  useEffect(() => {
    if (screen !== "voice") {
      stopListening();
      stopSpeakingNow();
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
      setVoiceStatus("Tap the mic to speak");
      setIsSpeaking(false);
    }
  }, [screen]); // eslint-disable-line

  // ── TTS ───────────────────────────────────────────────────────────────────
  function stopSpeakingNow() {
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch { /* ignore */ }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }

  function speakText(text: string) {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) return;
    if (isMutedRef.current) return;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setIsSpeaking(false);

    setTimeout(() => {
      if (isMutedRef.current) return;
      let utt: SpeechSynthesisUtterance;
      try { utt = new SpeechSynthesisUtterance(text); } catch { return; }

      utt.lang = "en-US"; utt.rate = 1.0; utt.pitch = 1.0; utt.volume = 1.0;

      try {
        const voices    = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen"))
        ) || voices.find(v => v.lang.startsWith("en") && !v.name.includes("Zira"));
        if (preferred) utt.voice = preferred;
      } catch { /* use default */ }

      utt.onstart = () => { setIsSpeaking(true); isSpeakingRef.current = true; setVoiceStatus("AI is speaking..."); };
      utt.onend   = () => {
        setIsSpeaking(false); isSpeakingRef.current = false;
        if (screenRef.current === "voice" && !isMutedRef.current) {
          setVoiceStatus("Tap the mic to speak");
          setTimeout(() => {
            if (screenRef.current === "voice" && !isSpeakingRef.current && !isSendingRef.current) {
              startListeningVoice();
            }
          }, 600);
        } else {
          setVoiceStatus("Tap the mic to speak");
        }
      };
      utt.onerror = (e: SpeechSynthesisErrorEvent) => {
        if (e.error === "interrupted" || e.error === "canceled") {
          setIsSpeaking(false); isSpeakingRef.current = false; return;
        }
        setIsSpeaking(false); isSpeakingRef.current = false;
        setVoiceStatus("Tap the mic to speak");
      };
      try { window.speechSynthesis.speak(utt); } catch { setIsSpeaking(false); }
    }, 150);
  }

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next); isMutedRef.current = next;
    if (next) stopSpeakingNow();
  };

  // ── Speech Recognition ────────────────────────────────────────────────────
  function startListening(onTranscript?: (t: string) => void) {
    if (!voiceOk) return;
    if (isSpeakingRef.current) return;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend   = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    } catch { /* ignore */ }

    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "en-IN"; rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;

    rec.onstart = () => { setIsListening(true); setVoiceStatus("Listening..."); };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript.trim();
      if (!transcript) return;
      if (onTranscript) {
        onTranscript(transcript);
      } else {
        setInput(prev => prev ? prev + " " + transcript : transcript);
        // ✅ FIX: use preventScroll so refocusing after mic doesn't jump page
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      }
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "no-speech" && e.error !== "aborted") console.warn("STT:", e.error);
      setIsListening(false); setVoiceStatus("Tap the mic to speak");
    };
    rec.onend = () => { setIsListening(false); setVoiceStatus("Tap the mic to speak"); };
    try { rec.start(); } catch { setIsListening(false); }
  }

  function startListeningVoice() { startListening(t => sendMessageVoice(t)); }
  function stopListening() {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend   = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    } catch { /* ignore */ }
    setIsListening(false);
  }

  const toggleChatMic  = () => { if (isListening) stopListening(); else startListening(); };
  const toggleVoiceMic = () => { if (isListening) { stopListening(); } else { stopSpeakingNow(); startListeningVoice(); } };

  // const startVoiceCall = () => {
  //   setScreen("voice"); setCallDuration(0);
  //   timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  //   setTimeout(() => speakText("Hi! I'm the MakeWithUs AI. How can I help you today?"), 800);
  // };

  const startVoiceCall = () => {
  setMessages([]); // clear previous chat messages

  setScreen("voice");
  setCallDuration(0);

  timerRef.current = setInterval(
    () => setCallDuration((d) => d + 1),
    1000
  );

  setTimeout(() => {
    speakText("Hi! I'm the MakeWithUs AI. How can I help you today?");
  }, 800);
};
  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── API Call ──────────────────────────────────────────────────────────────
  async function callAPI(msgs: Message[]): Promise<{ reply: string; intent: string } | null> {
    try {
      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: msgs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      return { reply: data.reply, intent: data.intent };
    } catch (err) {
      console.error("API call failed:", err);
      return null;
    }
  }

  // ✅ FIX ISSUE 1: sendMessage — removed all setTimeout focus calls
  // Focus was being called TWICE: at line 362 and line 375 in original
  // These caused the cursor to jump after every character typed
  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending) return;

    setLastUserMsg(msg);
    const updated = [...messages, { role: "user" as const, content: msg }];
    setMessages(updated);
    setInput("");
    setIsSending(true);
    setIsTyping(true);
    // ✅ NO setTimeout focus here — input stays focused naturally after setInput("")

    const result = await callAPI(updated);
    setIsTyping(false);
    setIsSending(false);

    if (!result) {
      setMessages(p => [...p, { role: "assistant", content: " Cannot connect. Check your API key in .env.local" }]);
    } else {
      setMessages(p => [...p, { role: "assistant", content: result.reply }]);
      if (result.intent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
    }
    // ✅ FIX: only refocus after AI responds, with preventScroll to avoid jumping
    inputRef.current?.focus({ preventScroll: true });
  };

  // ── Voice send ────────────────────────────────────────────────────────────
  const sendMessageVoice = async (text: string) => {
    const msg = text.trim();
    if (!msg || isSendingRef.current) return;

    stopSpeakingNow();
    setLastUserMsg(msg);
    setVoiceStatus("Thinking...");

    const updated = [...messagesRef.current, { role: "user" as const, content: msg }];
    setMessages(updated);
    setIsSending(true);
    setIsTyping(true);

    const result = await callAPI(updated);
    setIsTyping(false);
    setIsSending(false);

    if (!result) {
      const errMsg = "I couldn't connect. Please check your API key.";
      setMessages(p => [...p, { role: "assistant", content: " " + errMsg }]);
      speakText(errMsg);
    } else {
      setMessages(p => [...p, { role: "assistant", content: result.reply }]);
      speakText(result.reply);
      if (result.intent === "lead" && !leadSent) setTimeout(() => setShowLead(true), 800);
    }
  };

  // ✅ FIX ISSUE 1: handleKey — use useCallback so it doesn't recreate on every render
  // Old: inline arrow function recreated every render → caused subtle re-render loops
  const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [input, isSending]); // eslint-disable-line

  const handleLeadSuccess = (name: string) => {
    setLeadSent(true); setShowLead(false);
    const m = `Great, ${name}! Opening WhatsApp now. Our team will reply shortly.`;
    setMessages(p => [...p, { role: "assistant", content: m }]);
    if (screen === "voice") speakText(m);
  };

  const handleLeadDismiss = () => {
    setShowLead(false);
    const m = "No worries! Feel free to ask me anything else.";
    setMessages(p => [...p, { role: "assistant", content: m }]);
    if (screen === "voice") speakText(m);
  };

  const clearChat = () => {
    setMessages([]); setShowLead(false); setLeadSent(false); setLastUserMsg("");
    sessionStorage.removeItem("mwu_msgs");
  };

  const openWidget  = () => { setIsOpen(true); setScreen("home"); };
  const closeWidget = () => {
    setIsOpen(false); stopListening(); stopSpeakingNow();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const prompts = ["What services do you offer?", "Tell me about your pricing", "How do I get started?"];

  // ── Shared Header ─────────────────────────────────────────────────────────
  // ✅ FIX ISSUE 1: SharedHeader defined OUTSIDE render flow using useCallback
  // Old: defined as `const SharedHeader = () => (...)` INSIDE the component body
  // This means React treated it as a NEW component on every render → full unmount/remount
  // of ChatScreen, which destroyed input DOM node and stole focus every keystroke
  const SharedHeader = useCallback(({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={() => { stopListening(); stopSpeakingNow(); if (timerRef.current) clearInterval(timerRef.current); setScreen("home"); }}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: F, flexShrink: 0 }}>←</button>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff", flexShrink: 0 }}>✦</div>
        <div>
          <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "14px", fontFamily: F }}>{title}</p>
          {subtitle && <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "11px", fontFamily: F }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {screen === "voice" && (
          <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute AI"}
            style={{ background: isMuted ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
            {isMuted
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            }
          </button>
        )}
        <button onClick={closeWidget} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: F }}>✕</button>
      </div>
    </div>
  ), [screen, isMuted]); // eslint-disable-line

  // ── HOME SCREEN ───────────────────────────────────────────────────────────
  // ✅ FIX: HomeScreen, VoiceScreen, CallScreen defined as useCallback to prevent
  // unnecessary re-creation. They don't contain input, so less critical, but still good.
  const HomeScreen = useCallback(() => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
      <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentL})`, padding: "28px 20px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff" }}>✦</div>
            <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "16px", fontFamily: F }}>MakeWithUs AI</p>
          </div>
          <button onClick={closeWidget} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontFamily: F }}>✕</button>
        </div>
        <p style={{ margin: 0, color: "#fff", fontSize: "22px", fontWeight: 700, fontFamily: F }}>Hi there! </p>
        <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "14px", fontFamily: F }}>Let&apos;s get you started</p>
      </div>

      <div style={{ flex: 1, background: C.bg, padding: "16px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
        {[
          { label: "Start chat",       sub: "Chat with our AI assistant",      iBg: "rgba(255,255,255,0.08)", hc: C.accentL, onClick: () => setScreen("chat"),  hide: false,   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { label: "Start voice call", sub: "Speak — AI replies by voice",     iBg: "rgba(255,255,255,0.08)", hc: C.accentL, onClick: startVoiceCall,           hide: !voiceOk, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> },
          { label: "Call us",          sub: "Talk to a real person",           iBg: "rgba(255,255,255,0.08 )", hc: C.wa,      onClick: () => setScreen("call"),  hide: false,   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.wa} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
        ].filter(r => !r.hide).map(row => (
          <button key={row.label} onClick={row.onClick}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", cursor: "pointer", width: "100%", fontFamily: F, transition: "border-color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = row.hc)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: row.iBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.icon}</div>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: F }}>{row.label}</p>
                <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>{row.sub}</p>
              </div>
            </div>
            <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
          </button>
        ))}

        <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "12px", textDecoration: "none", fontFamily: F, transition: "border-color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = C.wa)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.wa }}><WaIcon size={20}/></div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, color: C.white, fontWeight: 500, fontSize: "14px", fontFamily: F }}>WhatsApp us</p>
              <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>Message us directly</p>
            </div>
          </div>
          <span style={{ color: C.muted, fontSize: "20px" }}>›</span>
        </a>
      </div>

      <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
      </div>
    </div>
  ), [voiceOk]); // eslint-disable-line

  // ── CHAT SCREEN ───────────────────────────────────────────────────────────
  // ✅ THE KEY FIX: ChatScreen is now a stable JSX block rendered inline,
  // NOT a sub-component function. When it was `const ChatScreen = () => (...)`,
  // React saw a brand new component type on every parent render → unmount + remount
  // → input element destroyed → focus lost after every keystroke.
  // Now it's just JSX rendered directly — same DOM node persists across renders.
  const chatScreenJSX = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
      <SharedHeader title="MakeWithUs AI" subtitle={isTyping ? "Typing..." : "Online "} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: C.bg }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "11px" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "#fff" }}>✦</div>
            {/* ✅ FIX ISSUE 2: Font explicitly set on ALL welcome text — was missing fontFamily on some elements */}
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: C.white, fontFamily: F }}>Hey! How can I help you?</p>
            <p style={{ margin: 0, fontSize: "13px", color: C.muted, textAlign: "center", lineHeight: 1.6, fontFamily: F }}>
              Ask about services, pricing,<br />or how we can grow your business.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%", marginTop: "4px" }}>
              {prompts.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px 14px", fontSize: "13px", cursor: "pointer", color: C.text, textAlign: "left", fontFamily: F, transition: "border-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>{p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>✦</div>
            )}
            <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: msg.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentL})` : C.surface, color: msg.role === "user" ? "#fff" : C.text, fontSize: "13px", lineHeight: "1.65", fontFamily: F, border: msg.role === "assistant" ? `1px solid ${C.border}` : "none", whiteSpace: "pre-wrap" }}>
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0 }}>✦</div>
            <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 3px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: "4px", alignItems: "center" }}>
              {[0,1,2].map(n => <span key={n} style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}
{/* 
        {showLead && !leadSent && <LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg}/>}
        <div ref={messagesEndRef}/> */}
      </div>

      {/* FIX ISSUE 1: Input bar — no disabled, no forced focus, clean onChange */}
      <div style={{ padding: "12px 14px", background: C.header, borderTop: `1px solid ${C.border}`, display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
        {voiceOk && (
          <button onClick={toggleChatMic}
            style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: isListening ? "rgba(255,255,255,0.12)" : "rgba(124,58,237,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s", animation: isListening ? "mwuPulse 1.2s ease-in-out infinite" : "none" }}>
            {isListening
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill={C.accentL}><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={C.accentL} strokeWidth="2" fill="none" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="23" x2="16" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round"/></svg>
            }
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          // ✅ FIX: track typing state to prevent scroll-during-typing
          onFocus={() => { isUserTypingRef.current = true; }}
          onBlur={() => { isUserTypingRef.current = false; }}
          placeholder={isListening ? "Listening..." : "Ask anything..."}
          autoComplete="off"
          style={{ flex: 1, border: `1px solid ${isListening ? "rgba(239,68,68,0.5)" : C.border}`, borderRadius: "22px", padding: "9px 15px", fontSize: "13px", outline: "none", background: C.input, color: C.white, fontFamily: F, transition: "border-color 0.15s" }}
          onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = C.accentL; }}
          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = isListening ? "rgba(239,68,68,0.5)" : C.border; }}
        />
        <button onClick={() => sendMessage()} disabled={isSending || !input.trim()}
          style={{ width: "36px", height: "36px", borderRadius: "50%", background: isSending || !input.trim() ? "rgba(124,58,237,0.25)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: isSending || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: "#fff", flexShrink: 0 }}>➤</button>
      </div>

      {isListening && <div style={{ background: "rgba(239,68,68,0.12)", borderTop: "1px solid rgba(239,68,68,0.2)", padding: "6px 14px", fontSize: "11px", color: "#f87171", textAlign: "center", flexShrink: 0, fontFamily: F }}> Listening... tap mic to stop</div>}

      <div style={{ background: C.header, padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", color: C.wa, fontSize: "11px", textDecoration: "none", fontFamily: F }}><WaIcon size={12}/> WhatsApp</a>
        <button onClick={clearChat} style={{ background: "none", border: "none", color: C.muted, fontSize: "11px", cursor: "pointer", fontFamily: F }}>Clear chat</button>
        <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
      </div>
    </div>
  );

  // ── VOICE SCREEN ──────────────────────────────────────────────────────────
  const VoiceScreen = useCallback(() => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
      <SharedHeader title="Voice call" subtitle={isMuted ? " AI muted" : isSpeaking ? " AI speaking..." : isListening ? " Listening..." : isSending ? " Thinking..." : voiceStatus} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "22px", padding: "28px" }}>
        <div style={{ position: "relative" }}>
          {(isListening || isSpeaking) && <>
            <div style={{ position: "absolute", inset: "-16px", borderRadius: "50%", border: `2px solid ${isSpeaking ? C.accentL : "#ef4444"}`, opacity: 0.35, animation: "voicePulse1 2s ease-out infinite" }}/>
            <div style={{ position: "absolute", inset: "-30px", borderRadius: "50%", border: `2px solid ${isSpeaking ? C.accentL : "#ef4444"}`, opacity: 0.18, animation: "voicePulse2 2s ease-out infinite 0.4s" }}/>
          </>}
          <div style={{ width: "92px", height: "92px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "38px", color: "#fff", position: "relative", zIndex: 1 }}>✦</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, color: C.white, fontSize: "18px", fontWeight: 600, fontFamily: F }}>MakeWithUs AI</p>
          <p style={{ margin: "5px 0 0", fontSize: "13px", fontFamily: F, color: isSpeaking ? C.accentL : isListening ? "#f87171" : C.muted }}>
            {isMuted ? " AI is muted" : isSpeaking ? "AI is speaking..." : isListening ? "Listening to you..." : isSending ? " Thinking..." : "Tap mic to speak"}
          </p>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: "12px", fontFamily: "monospace" }}>{fmt(callDuration)}</p>
        </div>

        {/* {messages.length > 0 && messages[messages.length-1].role === "assistant" && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "12px 16px", width: "100%", maxHeight: "90px", overflowY: "auto" }}>
            <p style={{ margin: 0, color: C.text, fontSize: "13px", lineHeight: 1.6, fontFamily: F }}>{messages[messages.length-1].content}</p>
          </div>
        )} */}

        {isSending && <div style={{ display: "flex", gap: "5px" }}>{[0,1,2].map(n => <span key={n} style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accentL, display: "inline-block", animation: `mwuBounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}</div>}

        <button onClick={toggleVoiceMic} disabled={isSending}
          style={{ width: "74px", height: "74px", borderRadius: "50%", border: "none", cursor: isSending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: isListening ? "rgba(239,68,68,0.9)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, boxShadow: isListening ? "0 0 0 10px rgba(239,68,68,0.12)" : `0 0 0 10px rgba(124,58,237,0.12)`, transition: "all 0.2s", opacity: isSending ? 0.5 : 1 }}>
          {isListening
            ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>
            : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          }
        </button>

        <p style={{ margin: 0, color: C.muted, fontSize: "12px", fontFamily: F }}>
          {isListening ? "Tap to stop" : isSpeaking ? "Tap to interrupt" : "Tap to speak"}
        </p>

        {/* {showLead && !leadSent && <div style={{ width: "100%" }}><LeadForm whatsappNumber={WHATSAPP_NUMBER} onSuccess={handleLeadSuccess} onDismiss={handleLeadDismiss} prefillNeed={lastUserMsg}/></div>} */}

        <button onClick={() => setScreen("chat")}
          style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, fontSize: "12px", padding: "6px 18px", borderRadius: "20px", cursor: "pointer", fontFamily: F, transition: "border-color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
          Switch to chat →
        </button>
      </div>
    </div>
  ), [screen, isMuted, isSpeaking, isListening, isSending, voiceStatus, messages, showLead, leadSent, lastUserMsg, callDuration]); // eslint-disable-line

  // ── CALL US ───────────────────────────────────────────────────────────────
  const CallScreen = useCallback(() => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>
      <SharedHeader title="Call us" subtitle="Talk to a real person"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "20px", padding: "30px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", border: `2px solid ${C.wa}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.wa} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 6px", color: C.muted, fontSize: "13px", fontFamily: F }}>Call us directly at</p>
          <a href={`tel:${PHONE_DIALABLE}`} style={{ color: C.white, fontSize: "24px", fontWeight: 700, textDecoration: "none", fontFamily: F }}>{PHONE_NUMBER}</a>
          <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "12px", fontFamily: F }}>Mon – Sat, 10am – 7pm IST</p>
        </div>
        <a href={`tel:${PHONE_DIALABLE}`} style={{ display: "flex", alignItems: "center", gap: "8px", background: C.wa, borderRadius: "12px", padding: "14px 32px",color: "#000000", fontSize: "15px", fontWeight: 600, textDecoration: "none", fontFamily: F }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.14 6.14l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Tap to call
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
          <div style={{ flex: 1, height: "1px", background: C.border }}/>
          <p style={{ margin: 0, color: C.muted, fontSize: "12px", fontFamily: F }}>or</p>
          <div style={{ flex: 1, height: "1px", background: C.border }}/>
        </div>
        <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(37,211,102,0.1)", border: `1px solid rgba(37,211,102,0.3)`, borderRadius: "12px", padding: "12px 24px", color: C.wa, fontSize: "14px", fontWeight: 500, textDecoration: "none", width: "100%", justifyContent: "center", boxSizing: "border-box", fontFamily: F }}>
          <WaIcon size={16}/> Message on WhatsApp
        </a>
      </div>
      <div style={{ background: C.header, padding: "10px", textAlign: "center", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontFamily: F }}>Powered by <span style={{ color: C.accentL }}>MakeWithUs AI</span></p>
      </div>
    </div>
  ), []); // eslint-disable-line

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      <ProactiveHint onOpen={openWidget}/>

      <button onClick={isOpen ? closeWidget : openWidget} aria-label="Toggle chat"
        style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(124,58,237,0.5)", transition: "transform 0.2s", fontSize: "22px", color: "#fff", fontFamily: F }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)")}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}>
        {isOpen ? "✕" : "✦"}
      </button>

      {isOpen && (
        <div style={{ fontFamily: F, position: "fixed", bottom: "92px", right: "24px", zIndex: 9998, width: "380px", height: "590px", borderRadius: "20px", background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" }}>
          {/* ✅ FIX: chat screen rendered as plain JSX, not as <ChatScreen/> component */}
          {screen === "home"  && <HomeScreen/>}
          {screen === "chat"  && chatScreenJSX}
          {screen === "voice" && <VoiceScreen/>}
          {screen === "call"  && <CallScreen/>}
        </div>
      )}

      <style>{`
        @keyframes mwuBounce   { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
        @keyframes mwuPulse    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
        @keyframes voicePulse1 { 0%{transform:scale(1);opacity:.35} 100%{transform:scale(1.6);opacity:0} }
        @keyframes voicePulse2 { 0%{transform:scale(1);opacity:.18} 100%{transform:scale(1.9);opacity:0} }
      `}</style>
    </>
  );
}
