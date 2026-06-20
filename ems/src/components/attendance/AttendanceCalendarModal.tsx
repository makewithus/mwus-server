"use client";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Calendar, Loader2 } from "lucide-react";
import { AttendanceRecord, useEmployeeAttendance } from "@/hooks/useAttendance";

/* ─── Shared props ─── */
interface AttendanceCalendarModalProps {
  /** If provided, records are fetched internally for this employeeId (admin mode) */
  fetchEmployeeId?: string;
  /** Pre-loaded records (employee self-view mode) */
  records?: AttendanceRecord[];
  employeeId: string;
  employeeName: string;
  onClose: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayColor(status: string | undefined, isWeekend: boolean, isFuture: boolean) {
  if (isFuture) return { bg: "transparent", color: "var(--text-muted)", border: "1px solid transparent" };
  if (isWeekend && !status) return { bg: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "1px solid var(--border)" };
  if (!status) return { bg: "var(--accent-red-dim)", color: "var(--accent-red)", border: "1px solid rgba(239,68,68,0.3)" };
  switch (status) {
    case "Present":
    case "Late":
      return { bg: "var(--accent-green-dim)", color: "var(--accent-green)", border: "1px solid rgba(34,197,94,0.3)" };
    case "Half Day":
      return { bg: "var(--accent-amber-dim)", color: "var(--accent-amber)", border: "1px solid rgba(245,158,11,0.3)" };
    case "Absent":
      return { bg: "var(--accent-red-dim)", color: "var(--accent-red)", border: "1px solid rgba(239,68,68,0.3)" };
    case "Holiday":
      return { bg: "var(--accent-purple-dim)", color: "var(--accent-purple)", border: "1px solid rgba(168,85,247,0.3)" };
    default:
      return { bg: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "1px solid var(--border)" };
  }
}

/* ─── Inner calendar (pure display) ─── */
function CalendarGrid({ records, employeeName }: { records: AttendanceRecord[]; employeeName: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const statusMap = useMemo(() => {
    const map: Record<string, string> = {};
    records.forEach((r) => { if (r.date) map[r.date] = r.status; });
    return map;
  }, [records]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const presentCount = records.filter(r => r.date.startsWith(monthPrefix) && (r.status === "Present" || r.status === "Late")).length;
  const absentCount  = records.filter(r => r.date.startsWith(monthPrefix) && r.status === "Absent").length;
  const halfCount    = records.filter(r => r.date.startsWith(monthPrefix) && r.status === "Half Day").length;

  return (
    <>
      {/* Month nav */}
      <div style={{
        padding: "14px 22px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--bg-secondary)",
      }}>
        <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={prevMonth}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{MONTHS[month]} {year}</div>
        <button
          className="btn btn-ghost"
          style={{ padding: "6px 10px" }}
          onClick={nextMonth}
          disabled={year === today.getFullYear() && month >= today.getMonth()}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary chips */}
      <div style={{
        display: "flex", gap: 10, padding: "12px 22px",
        borderBottom: "1px solid var(--border)", flexWrap: "wrap",
      }}>
        {[
          { label: "Present", count: presentCount, color: "var(--accent-green)", bg: "var(--accent-green-dim)" },
          { label: "Absent",  count: absentCount,  color: "var(--accent-red)",   bg: "var(--accent-red-dim)" },
          { label: "Half Day",count: halfCount,    color: "var(--accent-amber)",  bg: "var(--accent-amber-dim)" },
        ].map((s) => (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 99,
            background: s.bg, color: s.color, fontSize: 12, fontWeight: 600,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{s.count}</span> {s.label}
          </div>
        ))}
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto", alignSelf: "center" }}>
          {employeeName}
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ padding: "16px 22px 20px", overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {DAYS.map((d) => (
            <div key={d} style={{
              textAlign: "center", fontSize: 11, fontWeight: 600,
              color: "var(--text-muted)", letterSpacing: "0.04em",
            }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === today.toISOString().split("T")[0];
            const isFuture = new Date(dateStr) > today;
            const cellDate = new Date(year, month, day);
            const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
            const status = statusMap[dateStr];
            const style = getDayColor(status, isWeekend, isFuture);

            return (
              <div
                key={dateStr}
                title={status ?? (isFuture ? "Future" : isWeekend ? "Weekend" : "No record — Absent")}
                style={{
                  aspectRatio: "1",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: isToday ? 700 : 500,
                  background: style.bg,
                  color: style.color,
                  border: isToday ? `2px solid var(--accent-blue)` : style.border,
                  cursor: "default",
                  transition: "transform 0.1s",
                  position: "relative",
                }}
              >
                {day}
                {isToday && (
                  <div style={{
                    position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
                    width: 4, height: 4, borderRadius: "50%", background: "var(--accent-blue)",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: "12px 22px", borderTop: "1px solid var(--border)",
        display: "flex", gap: 14, flexWrap: "wrap",
        background: "var(--bg-secondary)",
      }}>
        {[
          { color: "var(--accent-green)", label: "Present / Late" },
          { color: "var(--accent-red)",   label: "Absent" },
          { color: "var(--accent-amber)",  label: "Half Day" },
          { color: "var(--accent-purple)", label: "Holiday" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Admin mode: fetches records internally ─── */
function AdminCalendarView({ employeeId, employeeName, onClose }: { employeeId: string; employeeName: string; onClose: () => void }) {
  const { records, loading } = useEmployeeAttendance(employeeId);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: 0, width: 540, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "18px 22px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "var(--bg-secondary)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Calendar size={18} color="var(--accent-blue)" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Attendance Calendar</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{employeeName}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10, color: "var(--text-muted)" }}>
            <Loader2 size={18} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Loading attendance…</span>
          </div>
        ) : (
          <CalendarGrid records={records} employeeName={employeeName} />
        )}
      </div>
    </div>
  );
}

/* ─── Default export (employee self-view mode) ─── */
export default function AttendanceCalendarModal({
  employeeName,
  records = [],
  fetchEmployeeId,
  onClose,
}: AttendanceCalendarModalProps) {
  // If fetchEmployeeId is provided, use admin mode
  if (fetchEmployeeId) {
    return <AdminCalendarView employeeId={fetchEmployeeId} employeeName={employeeName} onClose={onClose} />;
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: 0, width: 540, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "18px 22px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "var(--bg-secondary)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Calendar size={18} color="var(--accent-blue)" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Attendance Calendar</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{employeeName}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <CalendarGrid records={records} employeeName={employeeName} />
      </div>
    </div>
  );
}
