"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X, GripVertical, ChevronDown, Loader2, ClipboardList } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { formatDate, TASK_STATUS } from "@/lib/utils";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  doc, updateDoc, serverTimestamp, where, getDocs
} from "firebase/firestore";

/* ─── Types ─────────────────────────────────────────────────── */
type Task = {
  id: string;
  title: string;
  desc: string;
  deadline: string;
  priority: string;
  status: string;
  assigneeId: string;   // Firebase UID of assigned employee
  assigneeName: string; // Display name
  progress: number;
  createdAt?: unknown;
};

type EmpOption = { uid: string; name: string; employeeId: string };

/* ─── Constants ──────────────────────────────────────────────── */
const PRIORITY_COLOR: Record<string, string> = {
  Low: "var(--text-muted)", Medium: "var(--accent-blue)",
  High: "var(--accent-amber)", Critical: "var(--accent-red)",
};
const PRIORITY_BG: Record<string, string> = {
  Low: "rgba(9,9,9,0.05)", Medium: "var(--accent-blue-dim)",
  High: "var(--accent-amber-dim)", Critical: "var(--accent-red-dim)",
};
const COLUMNS: { status: string; color: string }[] = [
  { status: "Pending", color: "var(--text-muted)" },
  { status: "In Progress", color: "var(--accent-blue)" },
  { status: "Review", color: "var(--accent-amber)" },
  { status: "Completed", color: "var(--accent-green)" },
];

const PROGRESS_MAP: Record<string, number> = {
  Pending: 0, "In Progress": 40, Review: 80, Completed: 100,
};

/* ─── Main page ──────────────────────────────────────────────── */
export default function TasksPage() {
  const { role, user, profile } = useAuthStore();
  const isAdmin = role === "super_admin" || role === "hr_admin";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [saving, setSaving] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "", desc: "", deadline: "", priority: "Medium",
    assigneeId: "", assigneeName: "",
  });

  /* ── Drag state ── */
  const dragId = useRef<string | null>(null);
  const dragTarget = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  /* ── Load employees for the picker (admins only) ── */
  /* We load from the `users` collection because the Firestore doc ID equals
     the Firebase Auth UID — this is what we store in `assigneeId` and what
     the employee's own query uses via user.uid. */
  useEffect(() => {
    if (!isAdmin) return;
    // No orderBy to avoid composite index requirement; sort in-memory
    const q = query(
      collection(db, "users"),
      where("role", "==", "employee")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const empList = snap.docs
          .map((d) => ({
            uid: d.id,                          // doc ID == Auth UID
            name: d.data().displayName ?? d.data().email ?? d.id,
            employeeId: d.data().employeeId ?? d.id,
          }))
          .filter((e) => e.name) // skip blank entries
          .sort((a, b) => a.name.localeCompare(b.name)); // sort in-memory
        setEmployees(empList);
      },
      (err) => {
        console.error("Failed to fetch employees for task picker:", err);
      }
    );
    return () => unsub();
  }, [isAdmin]);

  /* ── Real-time tasks listener ── */
  useEffect(() => {
    // Wait for both user AND role to be resolved (auth state might be async)
    if (!user?.uid || !role) return;

    let unsub: (() => void) | undefined;
    let unsub2: (() => void) | undefined;
    const taskMap = new Map<string, Task>();

    const mergeAndSet = () => {
      const taskList = Array.from(taskMap.values());
      if (!isAdmin) {
        taskList.sort((a, b) => {
          const aTime = (a.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
          const bTime = (b.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });
      }
      setTasks(taskList);
      setLoading(false);
    };

    const mapDoc = (d: import("firebase/firestore").QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title ?? "",
        desc: data.desc ?? "",
        deadline: data.deadline ?? "",
        priority: data.priority ?? "Medium",
        status: data.status ?? "Pending",
        assigneeId: data.assigneeId ?? "",
        assigneeName: data.assigneeName ?? "",
        progress: data.progress ?? 0,
        createdAt: data.createdAt,
      } as Task;
    };

    if (isAdmin) {
      // Admins see all tasks, newest first
      const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      unsub = onSnapshot(
        q,
        (snap) => {
          snap.docs.forEach((d) => taskMap.set(d.id, mapDoc(d)));
          mergeAndSet();
        },
        (err) => { console.error("Tasks listener error:", err); setLoading(false); }
      );
    } else {
      // Employees: query by assigneeId (Firebase Auth UID stored in users doc)
      // AND by assignedTo (alternate field) — handles any legacy data inconsistencies
      const q1 = query(collection(db, "tasks"), where("assigneeId", "==", user.uid));
      const q2 = query(collection(db, "tasks"), where("assignedTo", "==", user.uid));

      // Both listeners write into the same Map — deduplication is automatic.
      // Each listener independently triggers a re-render on updates.
      unsub = onSnapshot(
        q1,
        (snap) => { snap.docs.forEach((d) => taskMap.set(d.id, mapDoc(d))); mergeAndSet(); },
        (err) => { console.error("Tasks (assigneeId) error:", err); setLoading(false); }
      );
      unsub2 = onSnapshot(
        q2,
        (snap) => { snap.docs.forEach((d) => taskMap.set(d.id, mapDoc(d))); mergeAndSet(); },
        (err) => { console.error("Tasks (assignedTo) error:", err); setLoading(false); }
      );
    }

    return () => {
      unsub?.();
      unsub2?.();
    };
  }, [user?.uid, role, isAdmin]);

  /* ── Move task (updates Firestore) ── */
  const moveTask = useCallback(async (id: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === newStatus) return;
    try {
      await updateDoc(doc(db, "tasks", id), {
        status: newStatus,
        progress: PROGRESS_MAP[newStatus] ?? task.progress,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Moved to "${newStatus}"`);
    } catch {
      toast.error("Failed to update task");
      return; // stop here — don't attempt notifications
    }

    // Notify admins if an employee updated the task.
    // This is fire-and-forget — errors here must NEVER surface as "Failed to update task".
    if (!isAdmin) {
      try {
        const companyId = profile?.companyId || "default";
        const adminsSnap = await getDocs(
          query(collection(db, "users"), where("role", "in", ["super_admin", "hr_admin"]))
        );
        const notifPromises = adminsSnap.docs
          .filter((d) => d.data().companyId === companyId)
          .map((adminDoc) =>
            addDoc(collection(db, "notifications"), {
              companyId,
              userId: adminDoc.id,
              title: "Task Status Updated",
              message: `${profile?.displayName ?? "Employee"} marked "${task.title}" as "${newStatus}"`,
              type: "task",
              isRead: false,
              link: "/tasks",
              createdAt: serverTimestamp(),
            })
          );
        await Promise.allSettled(notifPromises); // allSettled = never throws
      } catch {
        // Notification failure is silent — the task update already succeeded
      }
    }
  }, [tasks, isAdmin, profile]);

  /* ── Create task ── */
  const addTask = async () => {
    if (!newTask.title.trim()) { toast.error("Task title is required"); return; }
    if (!newTask.assigneeId) { toast.error("Please select an assignee"); return; }
    if (!newTask.deadline) { toast.error("Please set a deadline"); return; }
    setSaving(true);
    try {
      const companyId = profile?.companyId || "default";
      await addDoc(collection(db, "tasks"), {
        companyId,
        title: newTask.title.trim(),
        desc: newTask.desc.trim(),
        deadline: newTask.deadline,
        priority: newTask.priority,
        status: "Pending",
        progress: 0,
        assigneeId: newTask.assigneeId,
        assigneeName: newTask.assigneeName,
        assignedTo: newTask.assigneeId, // Added for security rules check
        createdBy: profile?.displayName ?? "Admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Dispatch notification to employee
      await addDoc(collection(db, "notifications"), {
        companyId,
        userId: newTask.assigneeId,
        title: "New Task Assigned",
        message: `Admin assigned a new task: "${newTask.title.trim()}"`,
        type: "task",
        isRead: false,
        link: "/tasks",
        createdAt: serverTimestamp(),
      });

      toast.success(`Task assigned to ${newTask.assigneeName}!`);
      setNewTask({ title: "", desc: "", deadline: "", priority: "Medium", assigneeId: "", assigneeName: "" });
      setShowForm(false);
    } catch {
      toast.error("Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  /* ── Drag handlers ── */
  const onDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragEnd = () => {
    if (dragId.current && dragTarget.current) {
      moveTask(dragId.current, dragTarget.current);
    }
    dragId.current = null;
    dragTarget.current = null;
    setDraggingId(null);
    setOverColumn(null);
  };

  const onColumnDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragTarget.current = status;
    setOverColumn(status);
  };

  const onColumnDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = dragId.current ?? e.dataTransfer.getData("text/plain");
    if (id) moveTask(id, status);
    dragId.current = null;
    dragTarget.current = null;
    setDraggingId(null);
    setOverColumn(null);
  };

  const onColumnDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOverColumn(null);
    }
  };

  /* ── Employee can change their own task status ── */
  const onStatusChange = (taskId: string, newStatus: string) => {
    moveTask(taskId, newStatus);
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="page-subtitle">
            {isAdmin
              ? `${tasks.length} tasks across all employees`
              : `${tasks.filter((t) => t.status !== "Completed").length} active tasks assigned to you`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 3, gap: 2 }}>
            {(["kanban", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`btn ${viewMode === v ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "5px 12px", fontSize: 12, textTransform: "capitalize" }}
              >
                {v}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              id="task-create"
              className="btn btn-primary"
              style={{ gap: 6 }}
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} /> Assign Task
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10, color: "var(--text-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: 13 }}>Loading tasks…</span>
        </div>
      )}

      {/* ── Kanban ── */}
      {!loading && viewMode === "kanban" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          alignItems: "start",
          minHeight: 300,
        }}>
          {COLUMNS.map(({ status, color }) => {
            const col = tasks.filter((t) => t.status === status);
            const isOver = overColumn === status;
            return (
              <div
                key={status}
                onDragOver={(e) => onColumnDragOver(e, status)}
                onDrop={(e) => onColumnDrop(e, status)}
                onDragLeave={onColumnDragLeave}
                style={{
                  minHeight: 160,
                  borderRadius: "var(--radius)",
                  border: isOver ? `2px dashed ${color}` : "2px dashed transparent",
                  padding: 4,
                  transition: "border-color 0.15s, background 0.15s",
                  background: isOver ? `${color}18` : "transparent",
                }}
              >
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {status}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, background: "var(--bg-secondary)",
                    border: "1px solid var(--border)", padding: "1px 8px",
                    borderRadius: 99, color: "var(--text-muted)", fontFamily: "monospace",
                  }}>
                    {col.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, t.id)}
                      onDragEnd={onDragEnd}
                      className="card"
                      style={{
                        padding: "14px 16px",
                        cursor: "grab",
                        opacity: draggingId === t.id ? 0.35 : 1,
                        transition: "opacity 0.15s, box-shadow 0.15s",
                        boxShadow: draggingId === t.id ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                        userSelect: "none",
                        borderLeft: `3px solid ${PRIORITY_COLOR[t.priority] ?? "var(--border)"}`,
                      }}
                    >
                      {/* Priority + grip icon (always shown as drag handle for all users) */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span
                          className="badge"
                          style={{ background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority], fontSize: 10 }}
                        >
                          {t.priority}
                        </span>
                        <GripVertical size={13} color="var(--text-muted)" />
                      </div>

                      {/* Title + description */}
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{t.title}</div>
                      {t.desc && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5 }}>{t.desc}</div>
                      )}

                      {/* Progress bar */}
                      <div style={{ height: 3, borderRadius: 2, background: "var(--border)", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${t.progress}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
                      </div>

                      {/* Assignee + deadline */}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 0 }}>
                        <span>👤 {t.assigneeName.split(" ")[0]}</span>
                        {t.deadline && <span>📅 {formatDate(t.deadline)}</span>}
                      </div>

                      {/* Admin-only dropdown status changer (employees use drag) */}
                      {isAdmin && t.status !== "Completed" && (
                        <div style={{ position: "relative", marginTop: 10 }}>
                          <select
                            className="input-base"
                            style={{ fontSize: 11, padding: "5px 28px 5px 8px", appearance: "none" }}
                            value={t.status}
                            onChange={(e) => onStatusChange(t.id, e.target.value)}
                          >
                            {TASK_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={11} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty column hint */}
                  {col.length === 0 && (
                    <div style={{
                      padding: "28px 16px", textAlign: "center", fontSize: 12,
                      color: "var(--text-muted)", border: "1px dashed var(--border)",
                      borderRadius: "var(--radius-sm)",
                    }}>
                      Drag tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ── */}
      {!loading && viewMode === "list" && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const colColor = COLUMNS.find((c) => c.status === t.status)?.color ?? "var(--text-muted)";
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
                      {t.desc && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{t.desc}</div>}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.assigneeName}</td>
                    <td>
                      <span className="badge" style={{ background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority] }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {t.deadline ? formatDate(t.deadline) : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--border)", minWidth: 60 }}>
                          <div style={{ height: "100%", width: `${t.progress}%`, background: colColor, borderRadius: 2, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", width: 30 }}>{t.progress}%</span>
                      </div>
                    </td>
                    <td>
                      {t.status !== "Completed" && (isAdmin || t.assigneeId === user?.uid) ? (
                        <div style={{ position: "relative", display: "inline-block", minWidth: 120 }}>
                          <select
                            className="input-base"
                            style={{ fontSize: 12, padding: "4px 26px 4px 8px", appearance: "none" }}
                            value={t.status}
                            onChange={(e) => onStatusChange(t.id, e.target.value)}
                          >
                            {TASK_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={11} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
                        </div>
                      ) : (
                        <span className="badge" style={{ background: `${colColor}20`, color: colColor }}>{t.status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
          <ClipboardList size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>
            {isAdmin ? "No tasks yet. Assign one to get started." : "No tasks assigned to you yet."}
          </p>
        </div>
      )}

      {/* ── Create Task Modal (admins only) ── */}
      {showForm && isAdmin && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="card"
            style={{ padding: 32, width: 500, background: "var(--bg-primary)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Assign New Task</div>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setShowForm(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Task title */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Task Title <span style={{ color: "var(--accent-red)" }}>*</span>
                </label>
                <input
                  id="task-title"
                  className="input-base"
                  placeholder="e.g. Update employee handbook"
                  value={newTask.title}
                  onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* Assignee picker */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Assign To <span style={{ color: "var(--accent-red)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    id="task-assignee"
                    className="input-base"
                    style={{ appearance: "none", paddingRight: 32 }}
                    value={newTask.assigneeId}
                    onChange={(e) => {
                      const emp = employees.find((em) => em.uid === e.target.value);
                      setNewTask((p) => ({
                        ...p,
                        assigneeId: e.target.value,
                        assigneeName: emp?.name ?? "",
                      }));
                    }}
                  >
                    <option value="">— Select Employee —</option>
                    {employees.map((emp) => (
                      <option key={emp.uid} value={emp.uid}>
                        {emp.name} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  id="task-desc"
                  className="input-base"
                  rows={3}
                  placeholder="Describe the task in detail…"
                  value={newTask.desc}
                  onChange={(e) => setNewTask((p) => ({ ...p, desc: e.target.value }))}
                />
              </div>

              {/* Deadline + Priority */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Deadline <span style={{ color: "var(--accent-red)" }}>*</span>
                  </label>
                  <input
                    id="task-deadline"
                    type="date"
                    className="input-base"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask((p) => ({ ...p, deadline: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Priority
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      id="task-priority"
                      className="input-base"
                      style={{ appearance: "none", paddingRight: 32 }}
                      value={newTask.priority}
                      onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
                    >
                      {["Low", "Medium", "High", "Critical"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                id="task-submit"
                className="btn btn-primary"
                style={{ flex: 1, gap: 6 }}
                onClick={addTask}
                disabled={saving}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? "Assigning…" : "Assign Task"}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
