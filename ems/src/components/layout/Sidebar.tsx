"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign,
  FolderOpen, Bell, ClipboardList, BarChart3, Settings,
  ChevronLeft, MessageSquare, Crown,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const NAV = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, roles: ["super_admin","hr_admin","employee"] },
  { href: "/employees",     label: "Employees",     icon: Users,            roles: ["super_admin","hr_admin"] },
  { href: "/attendance",    label: "Attendance",    icon: Clock,            roles: ["super_admin","hr_admin","employee"] },
  { href: "/leaves",        label: "Leaves",        icon: CalendarDays,     roles: ["super_admin","hr_admin","employee"] },
  { href: "/payroll",       label: "Payroll",       icon: DollarSign,       roles: ["super_admin","hr_admin","employee"] },
  { href: "/documents",     label: "Documents",     icon: FolderOpen,       roles: ["super_admin","hr_admin"] },
  { href: "/notices",       label: "Notices",       icon: MessageSquare,    roles: ["super_admin","hr_admin","employee"] },
  { href: "/tasks",         label: "Tasks",         icon: ClipboardList,    roles: ["super_admin","hr_admin","employee"] },
  { href: "/reports",       label: "Reports",       icon: BarChart3,        roles: ["super_admin","hr_admin"] },
  { href: "/notifications", label: "Notifications", icon: Bell,             roles: ["super_admin","hr_admin","employee"] },
  { href: "/settings",      label: "Settings",      icon: Settings,         roles: ["super_admin","hr_admin","employee"] },
];

// Employer section — always visible to admins
const EMPLOYER_SECTION = {
  href: "/employer",
  label: "Employer",
  icon: Crown,
  roles: ["super_admin", "hr_admin"],
};

interface SidebarProps { open: boolean; onToggle: () => void; }

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useAuthStore();

  const filtered = NAV.filter((n) => !role || n.roles.includes(role));
  const showEmployer = role && EMPLOYER_SECTION.roles.includes(role);

  const linkStyle = (active: boolean, accentColor?: string) => ({
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: open ? "12px 16px" : "12px 0",
    justifyContent: open ? "flex-start" as const : "center" as const,
    marginBottom: 2,
    textDecoration: "none",
    color: active ? "#fff" : "var(--text-inverse)",
    background: active ? (accentColor || "var(--brand-red)") : "transparent",
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    transition: "background 0.12s, color 0.12s, padding 0.18s cubic-bezier(0.4,0,0.2,1)",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    border: active ? "none" : "1px solid transparent",
    borderRadius: 0,
  });

  return (
    <aside
      style={{
        width: open ? 260 : 88,
        minWidth: open ? 260 : 88,
        background: "var(--bg-dark)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.18s cubic-bezier(0.4,0,0.2,1), min-width 0.18s cubic-bezier(0.4,0,0.2,1)",
        willChange: "width",
        overflow: "hidden",
        height: "100vh",
        flexShrink: 0,
      }}
    >
      {/* Logo header */}
      <div style={{ height: 80, display: "flex", alignItems: "center", padding: "0 32px", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", opacity: open ? 1 : 0, transform: open ? "translateX(0)" : "translateX(-15px)", transition: "opacity 0.18s cubic-bezier(0.4,0,0.2,1), transform 0.18s cubic-bezier(0.4,0,0.2,1)", pointerEvents: open ? "auto" : "none", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-inverse)", letterSpacing: "-0.08em", textTransform: "uppercase" }}>
            makewithus
          </div>
        </div>

        <button
          onClick={onToggle}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          style={{ position: "absolute", right: open ? 24 : 30, top: 26, width: 28, height: 28, border: "none", background: "transparent", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "right 0.18s cubic-bezier(0.4,0,0.2,1), color 0.15s" }}
          onMouseOver={(e) => { e.currentTarget.style.color = "var(--text-inverse)"; }}
          onMouseOut={(e)  => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <ChevronLeft size={18} style={{ transform: open ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)" }} />
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "32px 16px", overflowY: "auto", overflowX: "hidden" }}>
        {filtered.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch
              title={!open ? label : undefined}
              style={linkStyle(active)}
              onMouseOver={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,49,49,0.12)"; e.currentTarget.style.color = "#fff"; } }}
              onMouseOut={(e)  => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-inverse)"; } }}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.5} style={{ minWidth: 18, flexShrink: 0 }} />
              <span style={{ opacity: open ? 1 : 0, maxWidth: open ? 200 : 0, transition: "opacity 0.13s ease, max-width 0.18s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* ── Employer Section divider + link ── */}
        {showEmployer && (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "16px 0" }} />
            {open && (
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", padding: "0 4px", marginBottom: 6 }}>
                ORGANIZATION
              </div>
            )}
            {(() => {
              const active = pathname.startsWith(EMPLOYER_SECTION.href);
              return (
                <Link
                  href={EMPLOYER_SECTION.href}
                  prefetch
                  title={!open ? EMPLOYER_SECTION.label : undefined}
                  style={{
                    ...linkStyle(active, "#E53E3E"),
                    background: active ? "#E53E3E" : "transparent",
                  }}
                  onMouseOver={(e) => { if (!active) { e.currentTarget.style.background = "rgba(229,62,62,0.12)"; e.currentTarget.style.color = "#fff"; } }}
                  onMouseOut={(e)  => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-inverse)"; } }}
                >
                  <Crown size={18} strokeWidth={active ? 2.5 : 1.5} style={{ minWidth: 18, flexShrink: 0, color: active ? "#fff" : "#E53E3E" }} />
                  <span style={{ opacity: open ? 1 : 0, maxWidth: open ? 200 : 0, transition: "opacity 0.13s ease, max-width 0.18s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
                    {EMPLOYER_SECTION.label}
                  </span>
                </Link>
              );
            })()}
          </>
        )}
      </nav>

      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 16px 32px 16px" }} />
    </aside>
  );
}
