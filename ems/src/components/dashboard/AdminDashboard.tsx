"use client";
import { useState, useEffect } from "react";
import {
  Users, Clock, UserX, CalendarDays, DollarSign,
  FolderOpen, Cake, Megaphone, TrendingUp, TrendingDown,
  Check, X, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  collection, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

const PIE_COLORS = [
  "var(--text-primary)",
  "var(--brand-red)",
  "#d98c00",
  "var(--text-secondary)",
  "var(--text-muted)",
];

const tooltipStyle = {
  backgroundColor: "var(--bg-tertiary)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text-primary)",
};

type LeaveRequest = {
  id: string;
  name: string;
  type: string;
  days: string;
  date: string;
  status: string;
};

export default function AdminDashboard() {
  const { profile } = useAuthStore();

  /* ─── Live state ─── */
  const [employeeCount, setEmployeeCount] = useState(0);
  const [presentCount, setPresentCount]   = useState(0);
  const [absentCount, setAbsentCount]     = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [noticeCount, setNoticeCount]     = useState(0);
  const [payrollTotal, setPayrollTotal]   = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [processingId, setProcessingId]  = useState<string | null>(null);
  const [departmentData, setDepartmentData] = useState<{ name: string; count: number }[]>([]);
  const [growthData, setGrowthData] = useState<{ month: string; employees: number }[]>([]);
  const [attendanceData, setAttendanceData] = useState<{ day: string; present: number; absent: number; late: number }[]>([]);
  const [leaveTypeData, setLeaveTypeData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [birthdayCount, setBirthdayCount] = useState(0);

  /* ── Real-time employees count, growth, departments, birthdays ── */
  useEffect(() => {
    const q = query(collection(db, "employees"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const allEmps = snap.docs.map((d) => d.data());
      setEmployeeCount(allEmps.length);

      // Department breakdown
      const deptMap: Record<string, number> = {};
      allEmps.forEach((e) => {
        const dept = e.department || "Other";
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      setDepartmentData(Object.entries(deptMap).map(([name, count]) => ({ name, count })));

      // Employee growth by month (from createdAt timestamps)
      const monthMap: Record<string, number> = {};
      allEmps.forEach((e) => {
        if (!e.createdAt) return;
        const d = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
        const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
        monthMap[key] = (monthMap[key] || 0) + 1;
      });
      const growthArr = Object.entries(monthMap).map(([month, employees]) => ({ month, employees }));
      // Show running cumulative total
      let running = 0;
      const cumulative = growthArr.map(({ month, employees }) => {
        running += employees;
        return { month, employees: running };
      });
      setGrowthData(cumulative.slice(-6));

      // Birthdays this week
      const today = new Date();
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      let bdays = 0;
      allEmps.forEach((e) => {
        if (!e.dob) return;
        const dob = new Date(e.dob);
        const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (thisYearBday >= today && thisYearBday <= weekEnd) bdays++;
      });
      setBirthdayCount(bdays);
    }, () => {});
    return () => unsub();
  }, []);

  /* ── Today's attendance stats ── */
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const q = query(collection(db, "attendance"), where("date", "==", todayStr));
    const unsub = onSnapshot(q, (snap) => {
      let present = 0, absent = 0;
      snap.docs.forEach((d) => {
        const s = d.data().status ?? "";
        if (s === "Present" || s === "Late") present++;
        else if (s === "Absent") absent++;
      });
      setPresentCount(present);
      setAbsentCount(absent);
    }, () => {});
    return () => unsub();
  }, []);

  /* ── Weekly attendance chart data (last 7 days) ── */
  useEffect(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDates.push(d.toISOString().split("T")[0]);
    }

    // Only fetch if we have a valid range
    if (weekDates.length === 0) return;

    const q = query(collection(db, "attendance"), where("date", "in", weekDates));
    const unsub = onSnapshot(q, (snap) => {
      const dayMap: Record<string, { present: number; absent: number; late: number }> = {};
      weekDates.forEach((dateStr) => {
        dayMap[dateStr] = { present: 0, absent: 0, late: 0 };
      });
      snap.docs.forEach((d) => {
        const data = d.data();
        const date = data.date;
        if (!dayMap[date]) return;
        if (data.status === "Present") dayMap[date].present++;
        else if (data.status === "Late") { dayMap[date].present++; dayMap[date].late++; }
        else if (data.status === "Absent") dayMap[date].absent++;
      });
      const result = weekDates.map((dateStr, i) => ({
        day: days[i],
        ...dayMap[dateStr],
      }));
      setAttendanceData(result);
    }, () => {});
    return () => unsub();
  }, []);

  /* ── Leave type distribution ── */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "leaveRequests"), (snap) => {
      const typeMap: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const t = d.data().leaveType ?? "Other";
        typeMap[t] = (typeMap[t] || 0) + 1;
      });
      const arr = Object.entries(typeMap).map(([name, value], i) => ({
        name, value, color: PIE_COLORS[i % PIE_COLORS.length],
      }));
      setLeaveTypeData(arr);
    }, () => {});
    return () => unsub();
  }, []);

  /* ── Documents count ── */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "documents"), (snap) => {
      setDocumentCount(snap.size);
    }, () => {});
    return () => unsub();
  }, []);

  /* ── Notices count (new/unread) ── */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "notices"), (snap) => {
      // Count notices created in last 7 days as "new"
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let newCount = 0;
      snap.docs.forEach((d) => {
        const data = d.data();
        const created = data.createdAt?.toDate?.() ?? null;
        if (created && created >= weekAgo) newCount++;
      });
      setNoticeCount(newCount);
    }, () => {});
    return () => unsub();
  }, []);

  /* ── Payroll total (current month) ── */
  useEffect(() => {
    const now = new Date();
    const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
    const q = query(collection(db, "payroll"), where("month", "==", monthLabel));
    const unsub = onSnapshot(q, (snap) => {
      const total = snap.docs.reduce((sum, d) => sum + (d.data().net ?? 0), 0);
      setPayrollTotal(total);
    }, () => {});
    return () => unsub();
  }, []);

  /* ── Real-time pending leave requests ── */
  useEffect(() => {
    const q = query(collection(db, "leaveRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: LeaveRequest[] = snap.docs
          .map((d) => {
            const data = d.data();
            const start = data.startDate ?? "";
            const end   = data.endDate   ?? "";
            const fmt = (s: string) =>
              s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
            return {
              id:     d.id,
              name:   data.employeeName ?? "Employee",
              type:   data.leaveType   ?? "",
              days:   `${data.days ?? 1} day${(data.days ?? 1) > 1 ? "s" : ""}`,
              date:   start === end || !end ? fmt(start) : `${fmt(start)}–${fmt(end)}`,
              status: data.status      ?? "Pending",
            };
          })
          .filter((r) => r.status === "Pending");

        setPendingLeaves(rows);
        setLoadingLeaves(false);
      },
      () => {
        setPendingLeaves([]);
        setLoadingLeaves(false);
      }
    );
    return () => unsub();
  }, []);

  /* ── Approve / Reject ── */
  const handleLeaveAction = async (id: string, action: "Approved" | "Rejected") => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, "leaveRequests", id), {
        status:     action,
        reviewedBy: profile?.displayName ?? "Admin",
        reviewedAt: serverTimestamp(),
        updatedAt:  serverTimestamp(),
      });
      toast.success(`Leave request ${action.toLowerCase()} successfully!`);
    } catch {
      toast.error("Failed to update leave request.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = pendingLeaves.length;

  /* ── Format payroll total ── */
  const formatPayroll = (n: number) => {
    if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  const STATS = [
    { label: "Total Employees",     value: String(employeeCount || 0), icon: Users,       color: "var(--accent-blue)",   delta: "Active employees",      up: true  },
    { label: "Present Today",       value: String(presentCount),        icon: Clock,       color: "var(--accent-green)",  delta: `${employeeCount ? Math.round(presentCount / employeeCount * 100) : 0}% attendance`, up: true  },
    { label: "Absent Today",        value: String(absentCount),         icon: UserX,       color: "var(--accent-red)",    delta: "From attendance records", up: false },
    { label: "Pending Leaves",      value: String(pendingCount),        icon: CalendarDays,color: "var(--accent-amber)",  delta: `${Math.min(pendingCount,4)} urgent`,      up: false },
    { label: "Payroll This Month",  value: payrollTotal > 0 ? formatPayroll(payrollTotal) : "—", icon: DollarSign, color: "var(--accent-purple)", delta: new Date().toLocaleString("default", { month: "long" }), up: true },
    { label: "Documents",           value: String(documentCount || 0),  icon: FolderOpen,  color: "var(--accent-blue)",   delta: "Total files",            up: true  },
    { label: "Birthdays This Week", value: String(birthdayCount || 0),  icon: Cake,        color: "var(--accent-amber)",  delta: birthdayCount > 0 ? "Send wishes! 🎂" : "No birthdays", up: birthdayCount > 0 },
    { label: "New Notices",         value: String(noticeCount || 0),    icon: Megaphone,   color: "var(--accent-red)",    delta: "This week",              up: false },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here&apos;s what&apos;s happening today.</p>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {STATS.map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={18} color={s.color} />
              </div>
              {s.up ? <TrendingUp size={14} color="var(--accent-green)" /> : <TrendingDown size={14} color="var(--accent-red)" />}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Attendance Trend */}
        <div className="card" style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Weekly Attendance</div>
          {attendanceData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No attendance records this week
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceData} barSize={10} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg-secondary)" }} />
                <Bar dataKey="present" fill="var(--text-primary)" radius={[0, 0, 0, 0]} name="Present" />
                <Bar dataKey="absent"  fill="var(--brand-red)" radius={[0, 0, 0, 0]} name="Absent" />
                <Bar dataKey="late"    fill="var(--text-muted)" radius={[0, 0, 0, 0]} name="Late" />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Employee Growth */}
        <div className="card" style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Employee Growth</div>
          {growthData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No employee data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="employees" stroke="var(--text-primary)" fill="transparent" strokeWidth={2} dot={{ r: 3, fill: "var(--text-primary)" }} name="Employees" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Dept breakdown — live */}
        <div className="card" style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Employees by Department</div>
          {departmentData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No department data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={departmentData} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg-secondary)" }} />
                <Bar dataKey="count" fill="var(--text-primary)" radius={[0, 0, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leave Pie */}
        <div className="card" style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Leave Distribution</div>
          {leaveTypeData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No leave requests yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={leaveTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value" paddingAngle={3}>
                    {leaveTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                {leaveTypeData.map((d) => (
                  <div key={d.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                      {d.name}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending Leave Requests — Live */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Pending Leave Requests
            {pendingCount > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, background: "var(--accent-amber)", color: "#fff", borderRadius: 99, padding: "2px 8px" }}>
                {pendingCount}
              </span>
            )}
          </div>
          {loadingLeaves && <Loader2 size={14} className="animate-spin" color="var(--text-muted)" />}
        </div>

        {loadingLeaves ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 10, color: "var(--text-muted)" }}>
            <Loader2 size={18} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Loading requests…</span>
          </div>
        ) : pendingLeaves.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
            ✅ No pending leave requests
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {pendingLeaves.map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: "var(--radius-sm)",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  opacity: processingId === r.id ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--accent-blue)" }}>
                    {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.type} · {r.date} · {r.days}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "5px 12px", fontSize: 12, gap: 4 }}
                    disabled={processingId === r.id}
                    onClick={() => handleLeaveAction(r.id, "Approved")}
                  >
                    {processingId === r.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: "5px 12px", fontSize: 12, gap: 4 }}
                    disabled={processingId === r.id}
                    onClick={() => handleLeaveAction(r.id, "Rejected")}
                  >
                    {processingId === r.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
