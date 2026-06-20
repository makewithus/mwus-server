"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import NavProgress from "@/components/layout/NavProgress";
import IdleTimer from "@/components/layout/IdleTimer";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  const { role } = useAuthStore();

  // On mobile (<768px) sidebar starts closed; on desktop starts open
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      setSidebarOpen(!e.matches); // desktop → open, mobile → closed
    };
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // Safety: after 4s stop blocking even if initialized is still false
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if ((initialized || timedOut) && !loading && !user) {
      router.replace("/login");
    }
  }, [initialized, timedOut, loading, user, router]);

  /* ── Real-time deactivation watch for employees ──
     If admin deactivates this employee while they are logged in,
     this listener fires and instantly signs them out. */
  useEffect(() => {
    if (!user || role !== "employee") return;
    const q = query(
      collection(db, "employees"),
      where("uid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) return;
      const empStatus = snap.docs[0].data().status ?? "Active";
      if (empStatus === "Inactive" || empStatus === "Archived") {
        toast.error("Your account has been deactivated. You have been signed out.", { duration: 6000 });
        useAuthStore.getState().signOut();
        router.replace("/login/employee");
      }
    });
    return () => unsub();
  }, [user, role, router]);

  const showSpinner = !user && !initialized && !timedOut;
  if (showSpinner) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: "2.5px solid var(--accent-blue)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.75s linear infinite",
            }}
          />
          <span style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            Loading…
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-primary)", position: "relative" }}>
      <NavProgress />
      <IdleTimer />

      {/* Mobile backdrop — closes sidebar when tapped */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar — overlay on mobile, inline on desktop */}
      <div
        style={{
          position: isMobile ? "fixed" : "relative",
          top: 0,
          left: 0,
          height: "100%",
          zIndex: isMobile ? 50 : "auto",
          transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}
      >
        <Sidebar open={isMobile ? true : sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

