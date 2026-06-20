"use client";
import Link from "next/link";
import { ShieldCheck, User, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface PortalCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  delay?: number;
}

function PortalCard({
  title, subtitle, description, icon, href, delay = 0,
}: PortalCardProps) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block", width: "100%" }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay, ease: "easeOut" }}
        className="group w-full text-left"
      style={{
        background: "transparent",
        border: "1px solid var(--border-strong)",
        borderRadius: 0,
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.2s ease-out",
        display: "flex",
        alignItems: "center",
        gap: 16,
        outline: "none",
        position: "relative",
      }}
      onMouseOver={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--text-primary)";
        el.style.background = "var(--bg-elevated)";
        // Red line animation effect via inset box-shadow
        el.style.boxShadow = "inset 4px 0 0 0 var(--brand-red)";
      }}
      onMouseOut={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--border-strong)";
        el.style.background = "transparent";
        el.style.boxShadow = "none";
      }}
    >
      {/* Icon */}
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center"
        style={{ color: "var(--text-primary)" }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            style={{
              fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}
          >
            {subtitle}
          </span>
        </div>
        <h3
          style={{
            fontSize: 16, fontWeight: 700, color: "var(--text-primary)",
            marginBottom: 4, letterSpacing: "-0.04em", textTransform: "uppercase",
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>
          {description}
        </p>
      </div>

      {/* Arrow */}
      <div
        className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
        style={{ color: "var(--text-primary)" }}
      >
        <ArrowRight size={18} />
      </div>
      </motion.div>
    </Link>
  );
}

export function PortalSelectionPage() {
  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
      >
        {/* Header */}
        <p
          style={{
            fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
          }}
        >
          PORTAL ACCESS
        </p>
        <h1
          style={{
            fontSize: 32, fontWeight: 800, color: "var(--text-primary)",
            letterSpacing: "-0.04em", lineHeight: 1.15, marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
          Select System
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 40, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
          Choose your portal below to securely sign into the Employee Management System.
        </p>
      </motion.div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <PortalCard
          title="Admin Portal"
          subtitle="Administration"
          description="Manage employees, payroll, attendance, documents and approvals."
          icon={<ShieldCheck size={24} strokeWidth={1.5} />}
          href="/login/admin"
          delay={0.08}
        />
        <PortalCard
          title="Employee Portal"
          subtitle="Self Service"
          description="View attendance, request leave, access payslips and documents."
          icon={<User size={24} strokeWidth={1.5} />}
          href="/login/employee"
          delay={0.16}
        />
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{
          fontSize: 11, color: "var(--text-muted)", textAlign: "center",
          marginTop: 48, lineHeight: 1.5, letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        MWU INTERNAL PLATFORM · Encrypted Session
      </motion.p>
    </div>
  );
}
