"use client";
import { useState } from "react";
import {
  Crown, Briefcase, Mail, Phone, Globe, Linkedin,
  Award, Building2, TrendingUp, Users, DollarSign,
  Target, MessageSquare, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  linkedin: string;
  bio: string;
  since: string;
  initials: string;
  accentColor: string;
  highlights: string[];
};

const MEMBERS: Member[] = [
  {
    id: "sudarsanan",
    name: "Sudarsanan",
    title: "Managing Director",
    department: "Executive Leadership",
    email: "sudarsanan@makewithus.in",
    phone: "+91 98765 43210",
    linkedin: "linkedin.com/in/sudarsanan",
    bio: "Visionary leader driving MakeWithUs&apos;s strategic direction, growth, and operational excellence. Responsible for overall business performance, stakeholder relations, and long-term organizational vision.",
    since: "2020",
    initials: "SD",
    accentColor: "#E53E3E",
    highlights: [
      "P&L ownership across all business units",
      "Strategic growth & market expansion",
      "Investor & stakeholder management",
      "Organizational culture & leadership",
    ],
  },
  {
    id: "sherhan",
    name: "Sherhan",
    title: "Chief Executive Officer",
    department: "Executive Leadership",
    email: "sherhan@makewithus.in",
    phone: "+91 98765 43211",
    linkedin: "linkedin.com/in/sherhan",
    bio: "Dynamic CEO leading MakeWithUs with a focus on innovation, product excellence, and team empowerment. Drives execution of company strategy and ensures alignment across all departments.",
    since: "2020",
    initials: "SH",
    accentColor: "#3B82F6",
    highlights: [
      "Company-wide execution & delivery",
      "Product strategy & innovation",
      "Team leadership & talent development",
      "Client relationships & partnerships",
    ],
  },
];

const ORG_STATS = [
  { label: "Founded",          value: "2020",         icon: Building2,   color: "#E53E3E" },
  { label: "Team Size",        value: "Growing",      icon: Users,       color: "#3B82F6" },
  { label: "Revenue Focus",    value: "B2B / B2C",    icon: TrendingUp,  color: "#22C55E" },
  { label: "Payroll Managed",  value: "₹ In-house",   icon: DollarSign,  color: "#A855F7" },
];

function ContactModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!msg.trim()) { toast.error("Message cannot be empty."); return; }
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success(`Message sent to ${member.name}!`);
    setSending(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div className="card" style={{ padding: 28, width: 460, background: "var(--bg-primary)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Message {member.name}</div>
          <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}><X size={16} /></button>
        </div>
        <textarea
          className="input-base"
          rows={5}
          placeholder={`Write your message to ${member.name}…`}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          style={{ resize: "none", marginBottom: 14 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1, gap: 6 }} onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
            {sending ? "Sending…" : "Send Message"}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      {contactOpen && <ContactModal member={member} onClose={() => setContactOpen(false)} />}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header band */}
        <div style={{ height: 6, background: member.accentColor }} />
        <div style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 20 }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `${member.accentColor}18`,
              border: `2px solid ${member.accentColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: member.accentColor,
              flexShrink: 0,
            }}>
              {member.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{member.name}</div>
                <Crown size={14} color={member.accentColor} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: member.accentColor, marginBottom: 2 }}>{member.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                <Briefcase size={10} /> {member.department} · Since {member.since}
              </div>
            </div>
          </div>

          {/* Bio */}
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 18 }}>
            {member.bio}
          </p>

          {/* Key Responsibilities */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 10 }}>
              Key Responsibilities
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {member.highlights.map((h) => (
                <div key={h} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: member.accentColor, flexShrink: 0 }} />
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Contact details */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: Mail,     value: member.email,    href: `mailto:${member.email}` },
              { icon: Phone,    value: member.phone,    href: `tel:${member.phone}` },
              { icon: Linkedin, value: member.linkedin, href: `https://${member.linkedin}` },
            ].map(({ icon: Icon, value, href }) => (
              <a key={value} href={href} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", textDecoration: "none" }}
                onMouseOver={(e) => e.currentTarget.style.color = member.accentColor}
                onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
              >
                <Icon size={13} color="var(--text-muted)" />
                {value}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, gap: 6, fontSize: 12, background: member.accentColor, border: "none" }}
              onClick={() => setContactOpen(true)}
            >
              <MessageSquare size={13} /> Send Message
            </button>
            <a
              href={`mailto:${member.email}`}
              className="btn btn-secondary"
              style={{ flex: 1, gap: 6, fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Mail size={13} /> Email
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function EmployerPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employer</h1>
          <p className="page-subtitle">Executive leadership and company principals</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-muted)" }}>
          <Building2 size={13} />
          MakeWithUs Pvt Ltd
        </div>
      </div>

      {/* Org Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {ORG_STATS.map((s) => (
          <div key={s.label} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Section heading */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Crown size={16} color="var(--brand-red)" />
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
          Executive Leadership Team
        </div>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Member Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {MEMBERS.map((m) => <MemberCard key={m.id} member={m} />)}
      </div>

      {/* Company Vision Block */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Target size={16} color="var(--brand-red)" />
          <div style={{ fontSize: 14, fontWeight: 700 }}>Company Vision & Mission</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            {
              icon: Award,
              title: "Vision",
              desc: "To be the most trusted partner for businesses seeking technology-driven growth, building sustainable impact across industries.",
            },
            {
              icon: Target,
              title: "Mission",
              desc: "Empowering teams through innovative tools, transparent processes, and people-first leadership that unlocks every individual&apos;s potential.",
            },
            {
              icon: Globe,
              title: "Values",
              desc: "Integrity, Innovation, Ownership, and Excellence — the four pillars that guide every decision from the executive level down.",
            },
          ].map((v) => (
            <div key={v.title} style={{ padding: "16px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <v.icon size={14} color="var(--brand-red)" />
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{v.title}</div>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
