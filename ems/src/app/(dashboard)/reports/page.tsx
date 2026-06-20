"use client";
import { useState, useEffect } from "react";
import { Download, BarChart3, FileText, Users, Calendar, DollarSign, FolderOpen, Loader2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const REPORT_TYPES = [
  { id: "attendance", label: "Attendance Report",  icon: Calendar,   color: "var(--accent-blue)"   },
  { id: "leave",      label: "Leave Report",        icon: Calendar,   color: "var(--accent-amber)"  },
  { id: "payroll",    label: "Payroll Report",      icon: DollarSign, color: "var(--accent-purple)" },
  { id: "employee",   label: "Employee Report",     icon: Users,      color: "var(--accent-green)"  },
  { id: "department", label: "Department Report",   icon: BarChart3,  color: "var(--accent-red)"    },
  { id: "document",   label: "Document Report",     icon: FolderOpen, color: "var(--accent-blue)"   },
];

const tooltipStyle = {
  backgroundColor: "var(--bg-tertiary)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text-primary)",
};

function monthKey(ts: { toDate?: () => Date } | string | null): string {
  if (!ts) return "";
  const d = ts && typeof ts === "object" && typeof ts.toDate === "function" ? ts.toDate() : new Date(ts as string);
  return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

export default function ReportsPage() {
  const [active, setActive] = useState("attendance");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);

  // ── Live Attendance trend (monthly) ──
  const [attendanceTrend, setAttendanceTrend] = useState<{ month: string; present: number; absent: number; late: number }[]>([]);
  const [attLoading, setAttLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "attendance"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, { present: number; absent: number; late: number }> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const date: string = data.date ?? "";
        if (!date) return;
        const key = new Date(date).toLocaleString("default", { month: "short", year: "2-digit" });
        if (!map[key]) map[key] = { present: 0, absent: 0, late: 0 };
        if (data.status === "Present") map[key].present++;
        else if (data.status === "Late")    { map[key].present++; map[key].late++; }
        else if (data.status === "Absent")  map[key].absent++;
      });
      setAttendanceTrend(Object.entries(map).slice(-6).map(([month, v]) => ({ month, ...v })));
      setAttLoading(false);
    }, () => setAttLoading(false));
    return () => unsub();
  }, []);

  // ── Live Payroll trend (monthly) ──
  const [payrollTrend, setPayrollTrend] = useState<{ month: string; total: number }[]>([]);
  const [payLoading, setPayLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payroll"), (snap) => {
      const map: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const month: string = data.month ?? "";
        if (!month) return;
        map[month] = (map[month] || 0) + (data.net ?? 0);
      });
      // Convert "June 2026" style to "Jun '26" for chart
      const arr = Object.entries(map).map(([month, total]) => {
        const d = new Date(`1 ${month}`);
        const label = isNaN(d.getTime()) ? month : d.toLocaleString("default", { month: "short", year: "2-digit" });
        return { month: label, total };
      });
      setPayrollTrend(arr.slice(-6));
      setPayLoading(false);
    }, () => setPayLoading(false));
    return () => unsub();
  }, []);

  // ── Live Leave trend (monthly by type) ──
  const [leaveTrend, setLeaveTrend] = useState<{ month: string; casual: number; medical: number; emergency: number }[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "leaveRequests"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, { casual: number; medical: number; emergency: number }> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const key = monthKey(data.createdAt);
        if (!key) return;
        if (!map[key]) map[key] = { casual: 0, medical: 0, emergency: 0 };
        const t = (data.leaveType ?? "").toLowerCase();
        if (t === "casual") map[key].casual++;
        else if (t === "medical") map[key].medical++;
        else if (t === "emergency") map[key].emergency++;
      });
      setLeaveTrend(Object.entries(map).slice(-6).map(([month, v]) => ({ month, ...v })));
      setLeaveLoading(false);
    }, () => setLeaveLoading(false));
    return () => unsub();
  }, []);

  // ── Live Employee stats ──
  const [empStats, setEmpStats] = useState({ total: 0, active: 0, inactive: 0, deptBreakdown: [] as { name: string; count: number }[], growthTrend: [] as { month: string; employees: number }[] });
  const [empLoading, setEmpLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snap) => {
      const all = snap.docs.map((d) => d.data());
      const deptMap: Record<string, number> = {};
      const monthMap: Record<string, number> = {};
      let active = 0, inactive = 0;
      all.forEach((e) => {
        if (e.status === "Active") active++;
        else inactive++;
        const dept = e.department || "Other";
        deptMap[dept] = (deptMap[dept] || 0) + 1;
        if (e.createdAt) {
          const key = monthKey(e.createdAt);
          monthMap[key] = (monthMap[key] || 0) + 1;
        }
      });
      let running = 0;
      const growthTrend = Object.entries(monthMap).map(([month, count]) => {
        running += count;
        return { month, employees: running };
      }).slice(-6);
      const deptBreakdown = Object.entries(deptMap).map(([name, count]) => ({ name, count }));
      setEmpStats({ total: all.length, active, inactive, deptBreakdown, growthTrend });
      setEmpLoading(false);
    }, () => setEmpLoading(false));
    return () => unsub();
  }, []);

  // ── Live Document stats ──
  const [docStats, setDocStats] = useState({ total: 0, byFolder: [] as { name: string; count: number }[] });
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "documents"), (snap) => {
      const folderMap: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const fId = d.data().folderId || "Root";
        folderMap[fId] = (folderMap[fId] || 0) + 1;
      });
      setDocStats({ total: snap.size, byFolder: Object.entries(folderMap).map(([name, count]) => ({ name, count })) });
    }, () => {});
    return () => unsub();
  }, []);

  // Attendance summary stats
  const attTotal = attendanceTrend.reduce((s, r) => ({ present: s.present + r.present, absent: s.absent + r.absent, late: s.late + r.late }), { present: 0, absent: 0, late: 0 });
  const attDays = attTotal.present + attTotal.absent;
  const avgAtt = attDays ? ((attTotal.present / attDays) * 100).toFixed(1) : "—";

  const Spinner = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220, gap: 10, color: "var(--text-muted)" }}>
      <Loader2 size={18} className="animate-spin" />
      <span style={{ fontSize: 13 }}>Loading live data…</span>
    </div>
  );

  const EmptyChart = ({ label }: { label: string }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220, color: "var(--text-muted)", fontSize: 13 }}>
      No {label} data yet — records appear here as data is added.
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Live analytics across all modules</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button id="report-export-csv"   className="btn btn-secondary" style={{ gap: 6, fontSize: 13 }}><Download size={13} /> CSV</button>
          <button id="report-export-excel" className="btn btn-secondary" style={{ gap: 6, fontSize: 13 }}><Download size={13} /> Excel</button>
          <button id="report-export-pdf"   className="btn btn-primary"   style={{ gap: 6, fontSize: 13 }}><FileText  size={13} /> PDF</button>
        </div>
      </div>

      {/* Report type selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 24 }}>
        {REPORT_TYPES.map((r) => (
          <button key={r.id} onClick={() => setActive(r.id)} style={{
            padding: "12px 10px", borderRadius: "var(--radius-sm)", border: `1px solid ${active === r.id ? r.color : "var(--border)"}`,
            background: active === r.id ? `${r.color}14` : "var(--bg-secondary)", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all 0.15s",
          }}>
            <r.icon size={18} color={active === r.id ? r.color : "var(--text-muted)"} />
            <span style={{ fontSize: 11, fontWeight: active === r.id ? 600 : 400, color: active === r.id ? r.color : "var(--text-secondary)", textAlign: "center", lineHeight: 1.3 }}>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Date range */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>From</label>
          <input id="report-from" type="date" className="input-base" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: "auto" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>To</label>
          <input id="report-to" type="date" className="input-base" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: "auto" }} />
        </div>
        <button className="btn btn-secondary" style={{ fontSize: 13 }}>Apply Filter</button>
      </div>

      {/* ── Attendance ── */}
      {active === "attendance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: "20px 20px 12px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Monthly Attendance Trend</div>
            {attLoading ? <Spinner /> : attendanceTrend.length === 0 ? <EmptyChart label="attendance" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient id="presGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="present" stroke="#3B82F6" fill="url(#presGrad)" strokeWidth={2} name="Present" />
                  <Area type="monotone" dataKey="absent"  stroke="#EF4444" fill="none"           strokeWidth={2} strokeDasharray="4 2" name="Absent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card" style={{ padding: "20px 20px 12px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Attendance Breakdown</div>
            {attLoading ? <Spinner /> : attendanceTrend.length === 0 ? <EmptyChart label="attendance" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attendanceTrend} barSize={12} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="present" fill="#3B82F6" radius={[3,3,0,0]} name="Present" />
                  <Bar dataKey="absent"  fill="#EF4444" radius={[3,3,0,0]} name="Absent" />
                  <Bar dataKey="late"    fill="#F59E0B" radius={[3,3,0,0]} name="Late" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card" style={{ padding: "18px 20px", gridColumn: "1/-1" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Summary Statistics</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
              {[
                { label: "Avg Attendance", value: `${avgAtt}%`,               color: "var(--accent-blue)"  },
                { label: "Total Present",  value: attTotal.present.toString(), color: "var(--accent-green)" },
                { label: "Total Absent",   value: attTotal.absent.toString(),  color: "var(--accent-red)"   },
                { label: "Total Late",     value: attTotal.late.toString(),    color: "var(--accent-amber)" },
                { label: "Months Tracked", value: attendanceTrend.length.toString(), color: "var(--text-primary)" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginBottom: 4 }}>{attLoading ? "—" : s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Payroll ── */}
      {active === "payroll" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="card" style={{ padding: "20px 20px 12px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Monthly Payroll Disbursement (₹)</div>
            {payLoading ? <Spinner /> : payrollTrend.length === 0 ? <EmptyChart label="payroll" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={payrollTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${(v/1000).toFixed(1)}K`, "Total Payroll"]} />
                  <Line type="monotone" dataKey="total" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 4, fill: "#A855F7" }} name="Payroll" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Payroll summary */}
          {!payLoading && payrollTrend.length > 0 && (
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Payroll Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Total Disbursed", value: `₹${(payrollTrend.reduce((s, r) => s + r.total, 0)/1000).toFixed(0)}K`, color: "var(--accent-purple)" },
                  { label: "Peak Month",      value: payrollTrend.reduce((a, b) => a.total > b.total ? a : b).month,           color: "var(--accent-blue)"   },
                  { label: "Months on Record",value: payrollTrend.length.toString(),                                            color: "var(--text-primary)"  },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", padding: "12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Leave ── */}
      {active === "leave" && (
        <div className="card" style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Leave Trends by Type</div>
          {leaveLoading ? <Spinner /> : leaveTrend.length === 0 ? <EmptyChart label="leave" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leaveTrend} barSize={12} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="casual"    fill="#3B82F6" radius={[3,3,0,0]} name="Casual" />
                <Bar dataKey="medical"   fill="#22C55E" radius={[3,3,0,0]} name="Medical" />
                <Bar dataKey="emergency" fill="#EF4444" radius={[3,3,0,0]} name="Emergency" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Employee ── */}
      {active === "employee" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: "20px 20px 12px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Employee Growth</div>
            {empLoading ? <Spinner /> : empStats.growthTrend.length === 0 ? <EmptyChart label="growth" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={empStats.growthTrend}>
                  <defs>
                    <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="employees" stroke="#22C55E" fill="url(#empGrad)" strokeWidth={2} name="Employees" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Employee Summary</div>
            {empLoading ? <Spinner /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Total Employees", value: empStats.total, color: "var(--text-primary)" },
                  { label: "Active",           value: empStats.active, color: "var(--accent-green)" },
                  { label: "Inactive",         value: empStats.inactive, color: "var(--accent-red)" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
                    <span style={{ fontSize: 13 }}>{s.label}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Department ── */}
      {active === "department" && (
        <div className="card" style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Employees by Department</div>
          {empLoading ? <Spinner /> : empStats.deptBreakdown.length === 0 ? <EmptyChart label="department" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={empStats.deptBreakdown} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#E53E3E" radius={[0,3,3,0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Documents ── */}
      {active === "document" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Document Summary</div>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: "var(--accent-blue)", marginBottom: 8 }}>{docStats.total}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Documents</div>
            </div>
          </div>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Documents by Folder</div>
            {docStats.byFolder.length === 0 ? (
              <EmptyChart label="document" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {docStats.byFolder.map((f) => (
                  <div key={f.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{f.name}</span>
                    <span style={{ fontWeight: 600 }}>{f.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
