"use client";
import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, CalendarDays, DollarSign, ClipboardList, FolderOpen, Clock, Megaphone, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, doc, updateDoc, writeBatch } from "firebase/firestore";
import { toast } from "sonner";

const TYPE_CONFIG = {
  leave:      { icon: CalendarDays, color: "var(--accent-blue)",   bg: "var(--accent-blue-dim)"   },
  payslip:    { icon: DollarSign,   color: "var(--accent-purple)", bg: "var(--accent-purple-dim)" },
  task:       { icon: ClipboardList,color: "var(--accent-amber)",  bg: "var(--accent-amber-dim)"  },
  document:   { icon: FolderOpen,   color: "var(--accent-green)",  bg: "var(--accent-green-dim)"  },
  attendance: { icon: Clock,        color: "var(--accent-red)",    bg: "var(--accent-red-dim)"    },
  notice:     { icon: Megaphone,    color: "var(--accent-blue)",   bg: "var(--accent-blue-dim)"   },
  general:    { icon: Bell,         color: "var(--text-muted)",    bg: "rgba(255,255,255,0.06)"   },
};

type Notif = {
  id: string;
  type: "leave" | "payslip" | "task" | "document" | "attendance" | "notice" | "general";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"unread">("all");

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id:      d.id,
            type:    data.type || "general",
            title:   data.title || "",
            message: data.message || "",
            time:    data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            read:    !!data.isRead,
          };
        });

        // Sort in-memory to bypass index requirement
        list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        setNotifs(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [user?.uid]);

  const markRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllRead = async () => {
    try {
      const batch = writeBatch(db);
      notifs.forEach((n) => {
        if (!n.read) {
          batch.update(doc(db, "notifications", n.id), { isRead: true });
        }
      });
      await batch.commit();
      toast.success("All notifications marked as read!");
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const shown = filter==="unread" ? notifs.filter((n) => !n.read) : notifs;
  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ display:"flex", background:"var(--bg-elevated)", borderRadius:"var(--radius-sm)", padding:3, border:"1px solid var(--border)", gap:2 }}>
            {(["all","unread"] as const).map((f) => (
              <button key={f} onClick={()=>setFilter(f)} className={`btn ${filter===f?"btn-primary":"btn-ghost"}`} style={{ padding:"5px 14px", fontSize:12 }}>
                {f==="unread" ? `Unread (${unreadCount})` : "All"}
              </button>
            ))}
          </div>
          {unreadCount>0 && (
            <button id="notif-mark-all" onClick={markAllRead} className="btn btn-secondary" style={{ gap:6, fontSize:13 }}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 10, color: "var(--text-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: 13 }}>Loading notifications…</span>
        </div>
      )}

      {!loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:6, maxWidth:760 }}>
          {shown.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
            return (
              <div key={n.id} onClick={()=>markRead(n.id)} style={{ display:"flex", gap:14, padding:"16px 18px", background:n.read?"var(--bg-secondary)":"var(--bg-elevated)", border:`1px solid ${n.read?"var(--border)":"var(--border-strong)"}`, borderRadius:"var(--radius-sm)", cursor:"pointer", transition:"background 0.15s" }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <cfg.icon size={17} color={cfg.color} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:13.5, fontWeight:n.read?400:600 }}>{n.title}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, marginLeft:12 }}>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>{timeAgo(n.time)}</span>
                      {!n.read && <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--accent-blue)" }} />}
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.55 }}>{n.message}</p>
                </div>
                {!n.read && (
                  <button className="btn btn-ghost" style={{ padding:"4px 8px", alignSelf:"center" }} onClick={(e)=>{ e.stopPropagation(); markRead(n.id); }}>
                    <Check size={13} />
                  </button>
                )}
              </div>
            );
          })}
          {shown.length===0 && (
            <div style={{ textAlign:"center", padding:"64px 0", color:"var(--text-muted)" }}>
              <Bell size={36} style={{ margin:"0 auto 12px", opacity:0.3 }} />
              <p style={{ fontSize:14 }}>No {filter==="unread"?"unread ":""}notifications.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
