"use client";
import { useState, useEffect } from "react";
import { Plus, X, Megaphone, Bell, AlertTriangle, AlertCircle, Info, Check, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, doc, updateDoc, arrayUnion,
} from "firebase/firestore";

const PRIORITY_CONFIG = {
  Low:      { color: "var(--text-muted)",    bg: "rgba(255,255,255,0.06)", icon: Info },
  Normal:   { color: "var(--accent-blue)",   bg: "var(--accent-blue-dim)", icon: Bell },
  Urgent:   { color: "var(--accent-amber)",  bg: "var(--accent-amber-dim)", icon: AlertTriangle },
  Critical: { color: "var(--accent-red)",    bg: "var(--accent-red-dim)",  icon: AlertCircle },
};

type NoticeRow = {
  id: string;
  title: string;
  desc: string;
  dept: string;
  priority: string;
  date: string;
  expiry: string;
  readBy: string[];
};

export default function NoticesPage() {
  const { role, profile, user } = useAuthStore();
  const isAdmin = role === "super_admin" || role === "hr_admin";
  const currentUid = user?.uid ?? "";

  const [showForm, setShowForm] = useState(false);
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  /* Local optimistic set — UI updates instantly without waiting for Firestore snapshot */
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const { departments } = useDepartments();
  const [newNotice, setNewNotice] = useState({
    title: "", desc: "", priority: "Normal", dept: "All", publish: "", expiry: "",
  });

  /* ── Real-time listener ── */
  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: NoticeRow[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id:      d.id,
            title:   data.title       ?? "",
            desc:    data.description ?? "",
            dept:    data.department  ?? "All",
            priority:data.priority    ?? "Normal",
            date:    data.publishDate ?? (data.createdAt?.toDate?.().toISOString().split("T")[0] ?? ""),
            expiry:  data.expiryDate  ?? "",
            readBy:  Array.isArray(data.readBy) ? data.readBy : [],
          };
        });
        setNotices(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  /* ── Mark as read — optimistic update + Firestore persist ── */
  const markAsRead = async (id: string) => {
    if (!currentUid) {
      toast.error("You must be logged in to mark notices as read.");
      return;
    }
    if (markingId) return;

    // Optimistically update UI right away
    setLocalReadIds((prev) => new Set([...prev, id]));
    setMarkingId(id);

    try {
      await updateDoc(doc(db, "notices", id), {
        readBy: arrayUnion(currentUid),
      });
      toast.success("Marked as read!");
    } catch {
      // Revert optimistic update on failure
      setLocalReadIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      toast.error("Failed to mark as read. Please try again.");
    } finally {
      setMarkingId(null);
    }
  };

  const publishNotice = async () => {
    if (!newNotice.title.trim()) { toast.error("Please enter a notice title."); return; }
    try {
      await addDoc(collection(db, "notices"), {
        title:       newNotice.title,
        description: newNotice.desc,
        department:  newNotice.dept,
        priority:    newNotice.priority,
        publishDate: newNotice.publish || new Date().toISOString().split("T")[0],
        expiryDate:  newNotice.expiry || null,
        createdBy:   profile?.displayName ?? "Admin",
        readBy:      [],
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
      });
      toast.success("Notice published successfully!");
      setNewNotice({ title: "", desc: "", priority: "Normal", dept: "All", publish: "", expiry: "" });
      setShowForm(false);
    } catch { toast.error("Failed to publish notice."); }
  };

  const filtered = filter === "All" ? notices : notices.filter((n) => n.priority === filter);
  /* Count notices not yet read — consider both Firestore readBy and local optimistic set */
  const unreadCount = notices.filter(
    (n) => !n.readBy.includes(currentUid) && !localReadIds.has(n.id)
  ).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notices</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notice${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {isAdmin && (
          <button id="notice-create" className="btn btn-primary" style={{ gap: 6 }} onClick={() => setShowForm(true)}>
            <Plus size={14} /> Create Notice
          </button>
        )}
      </div>

      {/* Priority filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["All", "Critical", "Urgent", "Normal", "Low"].map((p) => (
          <button key={p} onClick={() => setFilter(p)} className={`btn ${filter === p ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: 12, padding: "6px 14px" }}>
            {p}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10, color: "var(--text-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: 13 }}>Loading notices…</span>
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((n) => {
            const cfg = PRIORITY_CONFIG[n.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.Normal;
            /* Mark as read if Firestore says so OR if optimistic local set has it */
            const isRead = n.readBy.includes(currentUid) || localReadIds.has(n.id);
            return (
              <div key={n.id} className="card" style={{ padding: "18px 20px", opacity: isRead ? 0.65 : 1, transition: "opacity 0.2s", borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", gap: 14, flex: 1 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <cfg.icon size={17} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: isRead ? 400 : 600 }}>{n.title}</span>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{n.priority}</span>
                        {n.dept !== "All" && <span className="badge badge-gray">{n.dept}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{n.desc}</p>
                      <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)" }}>
                        {n.date && <span>Posted: {formatDate(n.date)}</span>}
                        {n.expiry && <span>Expires: {formatDate(n.expiry)}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Read button — once clicked, becomes a static badge */}
                  {isRead ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", fontSize: 12, flexShrink: 0,
                      color: "var(--accent-green)", background: "var(--accent-green-dim)",
                      borderRadius: "var(--radius-sm)", border: "1px solid rgba(34,197,94,0.2)",
                    }}>
                      <Check size={12} /> Read
                    </div>
                  ) : (
                    <button
                      onClick={() => markAsRead(n.id)}
                      disabled={markingId === n.id}
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: 12, gap: 5, flexShrink: 0 }}
                    >
                      {markingId === n.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
              <Megaphone size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>No {filter === "All" ? "" : filter.toLowerCase()} notices yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Create notice modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ padding: 32, width: 520, boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Create Notice</div>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Title</label>
                <input id="notice-title" className="input-base" placeholder="Notice title…" value={newNotice.title} onChange={(e) => setNewNotice((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Description</label>
                <textarea id="notice-desc" className="input-base" rows={3} placeholder="Notice content…" value={newNotice.desc} onChange={(e) => setNewNotice((p) => ({ ...p, desc: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Priority</label>
                  <select id="notice-priority" className="input-base" value={newNotice.priority} onChange={(e) => setNewNotice((p) => ({ ...p, priority: e.target.value }))}>
                    {["Low", "Normal", "Urgent", "Critical"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Department</label>
                  <select id="notice-dept" className="input-base" value={newNotice.dept} onChange={(e) => setNewNotice((p) => ({ ...p, dept: e.target.value }))}>
                    <option value="All">All Departments</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Publish Date</label>
                  <input id="notice-publish" type="date" className="input-base" value={newNotice.publish} onChange={(e) => setNewNotice((p) => ({ ...p, publish: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Expiry Date</label>
                  <input id="notice-expiry" type="date" className="input-base" value={newNotice.expiry} onChange={(e) => setNewNotice((p) => ({ ...p, expiry: e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button id="notice-submit" className="btn btn-primary" style={{ flex: 1 }} onClick={publishNotice}>Publish Notice</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
