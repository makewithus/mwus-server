"use client";
import { useState, useMemo } from "react";
import { Clock, Play, Square, Coffee, ChevronDown, Loader2, CalendarDays, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useAttendanceStore } from "@/store/attendance.store";
import { formatDate } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import {
  useAttendanceByDate,
  useEmployeeAttendance,
  recordClockIn,
  recordClockOut,
  recordBreakStart,
  recordBreakEnd,
} from "@/hooks/useAttendance";
import AttendanceCalendarModal from "@/components/attendance/AttendanceCalendarModal";

const statusBadge: Record<string, { bg: string; color: string }> = {
  Present:    { bg: "var(--accent-green-dim)",  color: "var(--accent-green)" },
  Absent:     { bg: "var(--accent-red-dim)",    color: "var(--accent-red)" },
  Late:       { bg: "var(--accent-amber-dim)",  color: "var(--accent-amber)" },
  "Half Day": { bg: "var(--accent-purple-dim)", color: "var(--accent-purple)" },
  Holiday:    { bg: "var(--accent-blue-dim)",   color: "var(--accent-blue)" },
};

function fmt24to12(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export default function AttendancePage() {
  const { role, profile, user } = useAuthStore();
  const isAdmin = role === "super_admin" || role === "hr_admin";
  const { clockIn, clockOut, continueWork } = useAttendanceStore();

  const [dept, setDept] = useState("All");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [clocking, setClocking] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [quickGlance, setQuickGlance] = useState<{ employeeId: string; employeeName: string } | null>(null);
  const { departments } = useDepartments();
  const today = formatDate(new Date().toISOString());
  const todayStr = new Date().toISOString().split("T")[0];

  const { records: adminRecords, loading: adminLoading } = useAttendanceByDate(
    isAdmin ? selectedDate : ""
  );

  const employeeId = profile?.employeeId ?? "";
  const { records: empRecords, loading: empLoading } = useEmployeeAttendance(
    !isAdmin ? employeeId : ""
  );

  const todayRecord = useMemo(
    () => empRecords.find((r) => r.date === todayStr) ?? null,
    [empRecords, todayStr]
  );

  const hasClockedIn  = !!todayRecord?.clockIn;
  const hasClockedOut = !!todayRecord?.clockOut;
  const hasBreakStart = !!todayRecord?.breakStart;
  const hasBreakEnd   = !!todayRecord?.breakEnd;
  const isOnBreak     = hasBreakStart && !hasBreakEnd;

  const filteredAdmin = adminRecords.filter(
    (r) => dept === "All" || r.department === dept
  );

  const stats = {
    Present:    filteredAdmin.filter((r) => r.status === "Present" || r.status === "Late").length,
    Absent:     filteredAdmin.filter((r) => r.status === "Absent").length,
    Late:       filteredAdmin.filter((r) => r.status === "Late").length,
    "Half Day": filteredAdmin.filter((r) => r.status === "Half Day").length,
  };

  const handleClockIn = async () => {
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
      toast.error("Clock-in failed. Try again.");
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    setClocking(true);
    try {
      if (employeeId) {
        await recordClockOut(employeeId, todayRecord?.clockIn ?? "");
      }
      clockOut();
      toast.success("Clocked out successfully!");
    } catch {
      toast.error("Clock-out failed. Try again.");
    } finally {
      setClocking(false);
    }
  };

  const handleBreakStart = async () => {
    if (!hasClockedIn || hasClockedOut) {
      toast.error("You must be clocked in to start a break.");
      return;
    }
    setBreaking(true);
    try {
      if (employeeId) await recordBreakStart(employeeId);
      toast.success("Break started!");
    } catch {
      toast.error("Failed to start break.");
    } finally {
      setBreaking(false);
    }
  };

  const handleBreakEnd = async () => {
    setBreaking(true);
    try {
      if (employeeId) await recordBreakEnd(employeeId);
      toast.success("Break ended — back to work!");
    } catch {
      toast.error("Failed to end break.");
    } finally {
      setBreaking(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            {isAdmin ? `Daily attendance — ${today}` : "Track your daily attendance"}
          </p>
        </div>
        {!isAdmin && (
          <button id="att-calendar-view" className="btn btn-secondary" style={{ gap: 6 }} onClick={() => setShowCalendar(true)}>
            <CalendarDays size={14} /> Quick View
          </button>
        )}
      </div>

      {showCalendar && !isAdmin && (
        <AttendanceCalendarModal
          employeeId={employeeId}
          employeeName={profile?.displayName ?? "Employee"}
          records={empRecords}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {quickGlance && isAdmin && (
        <AttendanceCalendarModal
          employeeId={quickGlance.employeeId}
          employeeName={quickGlance.employeeName}
          fetchEmployeeId={quickGlance.employeeId}
          onClose={() => setQuickGlance(null)}
        />
      )}

      {/* Employee Clock Widget */}
      {!isAdmin && (
        <div className="card" style={{ padding: 24, maxWidth: 520, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Today&apos;s Attendance</div>

          {empLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Clock In",    value: todayRecord?.clockIn    ? fmt24to12(todayRecord.clockIn)    : "—", color: hasClockedIn  ? "var(--accent-green)" : "var(--text-muted)" },
                { label: "Clock Out",   value: todayRecord?.clockOut   ? fmt24to12(todayRecord.clockOut)   : "—", color: hasClockedOut ? "var(--accent-blue)"  : "var(--text-muted)" },
                { label: "Break Start", value: todayRecord?.breakStart ? fmt24to12(todayRecord.breakStart) : "—", color: hasBreakStart ? "var(--accent-amber)" : "var(--text-muted)" },
                { label: "Break End",   value: todayRecord?.breakEnd   ? fmt24to12(todayRecord.breakEnd)   : "—", color: hasBreakEnd   ? "var(--accent-amber)" : "var(--text-muted)" },
              ].map((i) => (
                <div key={i.label} style={{ padding: "14px 16px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{i.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: i.color }}>{i.value}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!hasClockedIn ? (
              <button id="att-clockin" onClick={handleClockIn} disabled={clocking || empLoading} className="btn btn-primary" style={{ gap: 6 }}>
                {clocking ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Clock In
              </button>
            ) : !hasClockedOut ? (
              <button id="att-clockout" onClick={handleClockOut} disabled={clocking} className="btn btn-secondary" style={{ gap: 6 }}>
                {clocking ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />} Clock Out
              </button>
            ) : (
              <button id="att-continue" onClick={() => { continueWork(); toast.success("Resumed working"); }} className="btn btn-primary" style={{ gap: 6 }}>
                <Play size={14} /> Continue Work
              </button>
            )}

            {hasClockedIn && !hasClockedOut && (
              isOnBreak ? (
                <button id="att-break-end" className="btn btn-secondary" style={{ gap: 6 }} disabled={breaking} onClick={handleBreakEnd}>
                  {breaking ? <Loader2 size={14} className="animate-spin" /> : <Coffee size={14} />} End Break
                </button>
              ) : (
                <button id="att-break-start" className="btn btn-secondary" style={{ gap: 6 }} disabled={breaking} onClick={handleBreakStart}>
                  {breaking ? <Loader2 size={14} className="animate-spin" /> : <Coffee size={14} />} Start Break
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Employee: recent attendance */}
      {!isAdmin && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent Attendance</div>
          {empLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          ) : empRecords.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>No attendance records yet.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Clock In</th><th>Clock Out</th><th>Break</th><th>Hours</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {empRecords.slice(0, 30).map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 13 }}>{r.date ? formatDate(r.date) : "—"}</td>
                      <td style={{ fontSize: 13, color: "var(--accent-green)", fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} />{r.clockIn ? fmt24to12(r.clockIn) : "—"}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{r.clockOut ? fmt24to12(r.clockOut) : "—"}</td>
                      <td style={{ fontSize: 13, color: "var(--accent-amber)" }}>
                        {r.breakStart ? fmt24to12(r.breakStart) : "—"}
                        {r.breakEnd ? ` – ${fmt24to12(r.breakEnd)}` : ""}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{r.hoursWorked}</td>
                      <td>
                        <span className="badge" style={{ background: statusBadge[r.status]?.bg, color: statusBadge[r.status]?.color }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Admin: Daily table */}
      {isAdmin && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Present",  value: stats.Present,     color: "var(--accent-green)" },
              { label: "Absent",   value: stats.Absent,      color: "var(--accent-red)" },
              { label: "Late",     value: stats.Late,        color: "var(--accent-amber)" },
              { label: "Half Day", value: stats["Half Day"], color: "var(--accent-purple)" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ position: "relative" }}>
              <select id="att-filter-dept" className="input-base" style={{ paddingRight: 32, appearance: "none", minWidth: 160 }} value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="All">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            </div>
            <input id="att-filter-date" type="date" className="input-base" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: "auto" }} />
          </div>

          {adminLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "var(--text-muted)", gap: 10 }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: 13 }}>Loading attendance…</span>
            </div>
          ) : filteredAdmin.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
              <Clock size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No attendance records for {formatDate(selectedDate)}</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>Records appear here once employees clock in.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th><th>Department</th><th>Clock In</th><th>Clock Out</th><th>Break</th><th>Hours</th><th>Status</th><th>Quick Glance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmin.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--accent-blue)" }}>
                            {r.employeeName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{r.employeeName}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.department || "—"}</td>
                      <td style={{ fontSize: 13, color: "var(--accent-green)", fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={12} />{r.clockIn ? fmt24to12(r.clockIn) : "—"}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{r.clockOut ? fmt24to12(r.clockOut) : "—"}</td>
                      <td style={{ fontSize: 13, color: "var(--accent-amber)" }}>
                        {r.breakStart ? fmt24to12(r.breakStart) : "—"}
                        {r.breakEnd ? ` – ${fmt24to12(r.breakEnd)}` : ""}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{r.hoursWorked}</td>
                      <td>
                        <span className="badge" style={{ background: statusBadge[r.status]?.bg, color: statusBadge[r.status]?.color }}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: "5px 10px", fontSize: 11, gap: 4 }} onClick={() => setQuickGlance({ employeeId: r.employeeId, employeeName: r.employeeName })}>
                          <Eye size={12} /> Glance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
