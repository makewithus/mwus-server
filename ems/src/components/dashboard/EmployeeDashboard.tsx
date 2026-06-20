"use client";
import { useState, useEffect, useMemo } from "react";
import { Clock, CalendarDays, DollarSign, Flame, Play, RefreshCw, Square, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useAttendanceStore } from "@/store/attendance.store";
import { useEmployeeAttendance, recordClockIn, recordClockOut } from "@/hooks/useAttendance";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot, orderBy, limit,
} from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";

const tooltipStyle = {
  backgroundColor: "var(--bg-tertiary)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text-primary)",
};

const priorityColor: Record<string, string> = {
  Urgent:   "var(--accent-red)",
  Critical: "var(--accent-red)",
  Normal:   "var(--accent-blue)",
  Low:      "var(--text-muted)",
};

const parseHours = (hStr: string | undefined): number => {
  if (!hStr || hStr === "—") return 0;
  const match = hStr.match(/(\d+)h(?:\s*(\d+)m)?/);
  if (match) {
    const hrs = parseInt(match[1], 10);
    const mins = match[2] ? parseInt(match[2], 10) : 0;
    return hrs + mins / 60;
  }
  return 0;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EmployeeDashboard() {
  const { profile, user } = useAuthStore();
  const { clockIn, clockOut, continueWork } = useAttendanceStore();

  const employeeId = profile?.employeeId ?? "";
  const todayStr = new Date().toISOString().split("T")[0];

  // Calendar state
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(
    today.toISOString().split("T")[0]
  );

  // Live attendance records
  const { records: empRecords, loading: empLoading } = useEmployeeAttendance(
    employeeId ? employeeId : ""
  );

  // Today's record
  const todayRecord = useMemo(
    () => empRecords.find((r) => r.date === todayStr) ?? null,
    [empRecords, todayStr]
  );

  // Map records by date for easy access
  const recordsMap = useMemo(() => {
    const map: Record<string, typeof empRecords[0]> = {};
    empRecords.forEach((r) => {
      if (r.date) map[r.date] = r;
    });
    return map;
  }, [empRecords]);

  // Selected date details
  const selectedRecord = useMemo(() => {
    if (!selectedCalendarDate) return null;
    return recordsMap[selectedCalendarDate] ?? null;
  }, [selectedCalendarDate, recordsMap]);

  // Calendar cells generation
  const firstDayIndex = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 1).getDay();
  }, [calendarYear, calendarMonth]);

  const totalDaysInMonth = useMemo(() => {
    return new Date(calendarYear, calendarMonth + 1, 0).getDate();
  }, [calendarYear, calendarMonth]);

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [
      ...Array(firstDayIndex).fill(null),
      ...Array.from({ length: totalDaysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [firstDayIndex, totalDaysInMonth]);

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    const currentToday = new Date();
    if (calendarYear === currentToday.getFullYear() && calendarMonth >= currentToday.getMonth()) {
      return;
    }
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const hasClockedIn  = !!todayRecord?.clockIn;
  const hasClockedOut = !!todayRecord?.clockOut;
  const [clocking, setClocking] = useState(false);

  // Live notices
  const [notices, setNotices] = useState<{ id: string; title: string; priority: string; createdAt: string }[]>([]);
  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3));
    const unsub = onSnapshot(q, (snap) => {
      setNotices(snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt?.toDate?.() ?? null;
        return {
          id: d.id,
          title: data.title ?? "",
          priority: data.priority ?? "Normal",
          createdAt: ts ? ts.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        };
      }));
    }, () => {});
    return () => unsub();
  }, []);

  // Live payslip (latest)
  const [latestPayslip, setLatestPayslip] = useState<{ net: number; month: string; status: string } | null>(null);
  useEffect(() => {
    if (!employeeId) return;
    const q = query(
      collection(db, "payroll"),
      where("employeeId", "==", employeeId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setLatestPayslip({ net: d.net ?? 0, month: d.month ?? "", status: d.status ?? "Generated" });
      }
    }, () => {});
    return () => unsub();
  }, [employeeId]);

  // Compute login streak from attendance records
  const loginStreak = useMemo(() => {
    if (empRecords.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      // Skip weekends
      const day = d.getDay();
      if (day === 0 || day === 6) continue;
      const rec = empRecords.find((r) => r.date === dateStr);
      if (rec && (rec.status === "Present" || rec.status === "Late")) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [empRecords]);

  // Last 5 working days activity data
  const activityData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const today = new Date();
    const result: { day: string; hours: number }[] = [];
    let dayIdx = 0;
    let i = 0;
    while (result.length < 5 && i < 14) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      i++;
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue;
      const dateStr = d.toISOString().split("T")[0];
      const rec = empRecords.find((r) => r.date === dateStr);
      let hours = 0;
      if (rec?.clockIn && rec?.clockOut) {
        const [inH, inM] = rec.clockIn.split(":").map(Number);
        const [outH, outM] = rec.clockOut.split(":").map(Number);
        const diff = (outH * 60 + outM) - (inH * 60 + inM);
        hours = Math.max(0, parseFloat((diff / 60).toFixed(1)));
      }
      result.unshift({ day: days[dow === 0 ? 6 : dow - 1] ?? `D${dayIdx}`, hours });
      dayIdx++;
    }
    return result;
  }, [empRecords]);

  // Format 24h time to 12h
  function fmt24to12(t: string): string {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  }

  const handleAction = async () => {
    if (!hasClockedIn) {
      setClocking(true);
      try {
        if (employeeId) {
          await recordClockIn(
            employeeId,
            profile?.displayName ?? "Employee",
            profile?.department ?? "",
            user?.uid
          );
        }
        clockIn();
        toast.success("Clocked in successfully!");
      } catch {
        toast.error("Clock-in failed.");
      } finally {
        setClocking(false);
      }
    } else if (!hasClockedOut) {
      setClocking(true);
      try {
        if (employeeId) {
          await recordClockOut(employeeId, todayRecord?.clockIn ?? "");
        }
        clockOut();
        toast.success("Clocked out successfully!");
      } catch {
        toast.error("Clock-out failed.");
      } finally {
        setClocking(false);
      }
    } else {
      continueWork();
      toast.success("Resumed working!");
    }
  };

  // Build STATS dynamically
  const todayStatus = empLoading ? "—" :
    todayRecord ? todayRecord.status :
    hasClockedIn ? "Present" : "Not Clocked In";

  const STATS = [
    {
      label: "Today's Status",
      value: todayStatus,
      icon: Clock,
      color: todayStatus === "Present" ? "var(--accent-green)" : todayStatus === "Late" ? "var(--accent-amber)" : "var(--text-muted)",
      sub: todayRecord?.clockIn ? `Clocked in at ${fmt24to12(todayRecord.clockIn)}` : "Not clocked in yet",
    },
    {
      label: "Login Streak",
      value: `${loginStreak} Day${loginStreak !== 1 ? "s" : ""}`,
      icon: Flame,
      color: loginStreak >= 5 ? "var(--accent-amber)" : "var(--text-muted)",
      sub: loginStreak >= 5 ? "Keep it up! 🔥" : loginStreak > 0 ? "You're on a roll!" : "Clock in to start streak",
    },
    {
      label: "Salary Status",
      value: latestPayslip ? latestPayslip.status : "—",
      icon: DollarSign,
      color: "var(--accent-purple)",
      sub: latestPayslip
        ? `${latestPayslip.month} · ${formatCurrency(latestPayslip.net)}`
        : "No payslip yet",
    },
    {
      label: "Notices",
      value: String(notices.length),
      icon: CalendarDays,
      color: "var(--accent-blue)",
      sub: notices.length > 0 ? notices[0].title.slice(0, 28) + "…" : "No new notices",
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Good morning — here&apos;s your day at a glance.</p>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {STATS.map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Clock In/Out Widget */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Attendance — Today</div>
          {empLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Clock In",  value: todayRecord?.clockIn  ? fmt24to12(todayRecord.clockIn)  : "—", color: hasClockedIn  ? "var(--accent-green)" : "var(--text-muted)" },
                { label: "Clock Out", value: todayRecord?.clockOut ? fmt24to12(todayRecord.clockOut) : "—", color: hasClockedOut ? "var(--accent-blue)"  : "var(--text-muted)" },
                { label: "Break Start", value: todayRecord?.breakStart ? fmt24to12(todayRecord.breakStart) : "—", color: todayRecord?.breakStart ? "var(--accent-amber)" : "var(--text-muted)" },
                { label: "Break End",   value: todayRecord?.breakEnd   ? fmt24to12(todayRecord.breakEnd)   : "—", color: todayRecord?.breakEnd   ? "var(--accent-amber)" : "var(--text-muted)" },
              ].map((item) => (
                <div key={item.label} style={{ padding: "12px 14px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
          <button
            className={`btn ${!hasClockedIn ? "btn-primary" : (!hasClockedOut ? "btn-secondary" : "btn-primary")}`}
            style={{ width: "100%", gap: 6 }}
            id="employee-clock-action-btn"
            onClick={handleAction}
            disabled={clocking || empLoading}
          >
            {clocking ? (
              <><Loader2 size={16} className="animate-spin" /> Loading…</>
            ) : !hasClockedIn ? (
              <><Play size={16} /> Clock In</>
            ) : !hasClockedOut ? (
              <><Square size={16} /> Clock Out</>
            ) : (
              <><RefreshCw size={16} /> Continue Work</>
            )}
          </button>
        </div>

        {/* Activity Graph */}
        <div className="card" style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Weekly Activity (Hours)</div>
          {activityData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Clock in to see your activity
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Area type="monotone" dataKey="hours" stroke="#3B82F6" fill="url(#activityGrad)" strokeWidth={2} activeDot={{ r: 4, fill: "#3B82F6" }} name="Hours Logged" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
        {/* Productivity & Login Calendar */}
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarDays size={16} color="var(--brand-red)" />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Productivity &amp; Login Calendar</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={prevMonth}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 100, textAlign: "center" }}>
                {MONTHS[calendarMonth]} {calendarYear}
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: "4px 8px" }}
                onClick={nextMonth}
                disabled={calendarYear === today.getFullYear() && calendarMonth >= today.getMonth()}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8, textAlign: "center" }}>
              {DAYS.map((d) => (
                <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                  {d.toUpperCase()}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {calendarCells.map((cellDay, idx) => {
                if (cellDay === null) return <div key={`empty-${idx}`} />;
                
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(cellDay).padStart(2, "0")}`;
                const isSelected = selectedCalendarDate === dateStr;
                const cellDate = new Date(calendarYear, calendarMonth, cellDay);
                const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
                const isFuture = cellDate > today;
                const isToday = dateStr === todayStr;
                const rec = recordsMap[dateStr];

                let bg = "var(--bg-secondary)";
                let color = "var(--text-primary)";
                let border = "1px solid var(--border)";
                let title = "No record";

                if (isFuture) {
                  bg = "transparent";
                  color = "var(--text-muted)";
                  border = "1px solid transparent";
                  title = "Future date";
                } else if (rec) {
                  const hours = parseHours(rec.hoursWorked);
                  const status = rec.status;
                  if (status === "Present" || status === "Late") {
                    if (hours >= 8) {
                      bg = "rgba(30, 158, 85, 0.25)";
                      color = "var(--accent-green)";
                      border = "1px solid var(--accent-green)";
                      title = `${status} (${rec.hoursWorked})`;
                    } else if (hours >= 5) {
                      bg = "rgba(30, 158, 85, 0.12)";
                      color = "var(--accent-green)";
                      border = "1px solid rgba(30, 158, 85, 0.4)";
                      title = `${status} (${rec.hoursWorked})`;
                    } else {
                      bg = "rgba(217, 140, 0, 0.12)";
                      color = "var(--accent-amber)";
                      border = "1px solid rgba(217, 140, 0, 0.4)";
                      title = `${status} (${rec.hoursWorked})`;
                    }
                  } else if (status === "Half Day") {
                    bg = "rgba(217, 140, 0, 0.12)";
                    color = "var(--accent-amber)";
                    border = "1px solid var(--accent-amber)";
                    title = `Half Day (${rec.hoursWorked})`;
                  } else if (status === "Absent") {
                    bg = "rgba(255, 49, 49, 0.12)";
                    color = "var(--accent-red)";
                    border = "1px solid var(--accent-red)";
                    title = "Absent";
                  } else if (status === "Holiday") {
                    bg = "var(--accent-purple-dim)";
                    color = "var(--text-primary)";
                    border = "1px solid var(--border)";
                    title = "Holiday";
                  }
                } else if (isWeekend) {
                  bg = "var(--bg-secondary)";
                  color = "var(--text-muted)";
                  border = "1px solid var(--border)";
                  title = "Weekend";
                } else {
                  bg = "rgba(255, 49, 49, 0.05)";
                  color = "var(--accent-red)";
                  border = "1px solid rgba(255, 49, 49, 0.2)";
                  title = "Absent (No activity)";
                }

                return (
                  <button
                    key={dateStr}
                    title={title}
                    disabled={isFuture}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: isToday ? 700 : 500,
                      background: bg,
                      color: color,
                      border: isSelected ? "2.5px solid var(--text-primary)" : (isToday ? "2px solid var(--brand-red)" : border),
                      cursor: isFuture ? "default" : "pointer",
                      position: "relative",
                      transition: "transform 0.1s, border-color 0.1s",
                      padding: 0,
                    }}
                    onClick={() => {
                      if (!isFuture) setSelectedCalendarDate(dateStr);
                    }}
                  >
                    {cellDay}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details Panel */}
          {selectedCalendarDate && (
            <div style={{
              padding: "12px 14px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              marginTop: "auto",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {new Date(selectedCalendarDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                    {selectedRecord ? (
                      selectedRecord.status === "Present" || selectedRecord.status === "Late" ? (
                        <>Clocked in at <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{selectedRecord.clockIn ? fmt24to12(selectedRecord.clockIn) : "—"}</span></>
                      ) : (
                        `Status: ${selectedRecord.status}`
                      )
                    ) : (
                      new Date(selectedCalendarDate).getDay() === 0 || new Date(selectedCalendarDate).getDay() === 6 ? "Weekend Rest Day" : "Absent — No log found"
                    )}
                  </div>
                </div>
                {selectedRecord && (
                  <span className="badge" style={{
                    background: selectedRecord.status === "Present" || selectedRecord.status === "Late" ? "var(--accent-green-dim)" : (selectedRecord.status === "Absent" ? "var(--accent-red-dim)" : "var(--accent-amber-dim)"),
                    color: selectedRecord.status === "Present" || selectedRecord.status === "Late" ? "var(--accent-green)" : (selectedRecord.status === "Absent" ? "var(--accent-red)" : "var(--accent-amber)"),
                    border: "none"
                  }}>
                    {selectedRecord.status}
                  </span>
                )}
              </div>

              {/* Productivity metrics */}
              {selectedRecord && (selectedRecord.status === "Present" || selectedRecord.status === "Late") ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                    <span>Productivity Score</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {Math.min(100, Math.round((parseHours(selectedRecord.hoursWorked) / 8) * 100))}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, Math.round((parseHours(selectedRecord.hoursWorked) / 8) * 100))}%`,
                      background: parseHours(selectedRecord.hoursWorked) >= 8 ? "var(--accent-green)" : (parseHours(selectedRecord.hoursWorked) >= 5 ? "var(--accent-green)" : "var(--accent-amber)"),
                      borderRadius: 2,
                    }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, color: "var(--text-secondary)", marginTop: 8 }}>
                    <div>Hours Worked: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{selectedRecord.hoursWorked}</span></div>
                    <div>Clock Out: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{selectedRecord.clockOut ? fmt24to12(selectedRecord.clockOut) : "Active Now"}</span></div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                  {new Date(selectedCalendarDate).getDay() === 0 || new Date(selectedCalendarDate).getDay() === 6 
                    ? "Enjoy your weekend rest!" 
                    : "No work hours logged. Marking productivity as 0%."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Notices</div>
          {notices.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "12px 0" }}>No notices yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {notices.map((n) => (
                <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: priorityColor[n.priority] ?? "var(--text-muted)" }}>{n.priority}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", marginLeft: 12 }}>{n.createdAt}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
