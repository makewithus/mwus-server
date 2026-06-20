"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User, Menu, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface TopbarProps { onMenuToggle: () => void; }

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", profile.uid),
      where("isRead", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
    return () => unsub();
  }, [profile?.uid]);

  const handleSignOut = () => {
    signOut();
    window.location.href = "/login";
  };

  const initials = profile?.displayName ? getInitials(profile.displayName) : "U";
  const roleBadge: Record<string, string> = {
    super_admin: "Super Admin",
    hr_admin: "HR Admin",
    employee: "Employee",
  };

  return (
    <header
      style={{
        height: 56,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 9,
        flexShrink: 0,
      }}
    >
      {/* Hamburger — always present, hidden on desktop via CSS */}
      <button
        onClick={onMenuToggle}
        className="btn btn-ghost topbar-menu-btn"
        style={{ padding: "6px 8px", flexShrink: 0 }}
        id="topbar-menu-toggle"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* Search — hidden on very small screens */}
      <div className="topbar-search" style={{ flex: 1, maxWidth: 400, position: "relative" }}>
        <Search
          size={14}
          style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
        />
        <input
          id="topbar-search"
          type="text"
          placeholder="Search employees, documents…"
          className="input-base"
          style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: 13 }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <button
        className="btn btn-ghost"
        style={{ position: "relative", padding: "6px 8px", flexShrink: 0 }}
        onClick={() => router.push("/notifications")}
        id="topbar-notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent-red)",
              border: "2px solid var(--bg-secondary)",
            }}
          />
        )}
      </button>

      {/* Profile menu */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          id="topbar-profile"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            borderRadius: "var(--radius-sm)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--accent-blue-dim)",
              border: "1px solid var(--accent-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent-blue)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {profile?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoURL} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          {/* Profile text — hidden on mobile */}
          <div className="topbar-profile-text" style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3 }}>
              {profile?.displayName ?? "User"}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {roleBadge[profile?.role ?? "employee"] ?? "Employee"}
            </span>
          </div>
          <ChevronDown size={13} color="var(--text-muted)" />
        </button>

        {menuOpen && (
          <div
            className="card"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: 180,
              padding: "6px",
              zIndex: 100,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <button
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "flex-start", gap: 8, padding: "8px 10px" }}
              onClick={() => { setMenuOpen(false); router.push("/settings"); }}
            >
              <User size={14} /> Profile &amp; Settings
            </button>
            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            <button
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "flex-start", gap: 8, padding: "8px 10px", color: "var(--accent-red)" }}
              onClick={handleSignOut}
              id="topbar-signout"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

