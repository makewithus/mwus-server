"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  UserPlus, Search, Filter, Download, LayoutGrid, List,
  MoreHorizontal, Mail, Phone, Building2, ChevronDown, Users, Loader2,
  Eye, Trash2, CheckCircle, XCircle, KeyRound, EyeOff,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  collection, onSnapshot, query, orderBy,
  doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";
import { useAuthStore } from "@/store/auth.store";
import { updateEmployeeAuth } from "@/lib/firebase-secondary";

type EmpRow = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: string;
  joiningDate: string;
  salary: number;
  uid: string;
  password: string;
};

const statusColor: Record<string, string> = {
  Active:   "var(--accent-green)",
  Inactive: "var(--accent-red)",
  Archived: "var(--text-muted)",
};
const statusBg: Record<string, string> = {
  Active:   "var(--accent-green-dim)",
  Inactive: "var(--accent-red-dim)",
  Archived: "rgba(255,255,255,0.06)",
};

/* ─── Credentials Modal ─── */
function CredentialsModal({ emp, onClose }: { emp: EmpRow; onClose: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [newPass, setNewPass]   = useState("");
  const [curPass, setCurPass]   = useState(emp.password || "");
  const [showCur, setShowCur]   = useState(false);
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!newPass.trim()) { toast.error("Enter a new password."); return; }
    if (!curPass.trim()) { toast.error("Enter current password to authorize."); return; }
    setSaving(true);
    try {
      await updateEmployeeAuth(emp.employeeId, curPass, emp.employeeId, newPass);
      await updateDoc(doc(db, "employees", emp.id), { password: newPass, updatedAt: serverTimestamp() });
      if (emp.uid) await updateDoc(doc(db, "users", emp.uid), { updatedAt: serverTimestamp() });
      toast.success("Password updated successfully!");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div className="card" style={{ padding: 28, width: 440, background: "var(--bg-primary)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Portal Credentials</div>
          <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}><EyeOff size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Username (read-only) */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>Login Email</label>
            <input className="input-base" readOnly value={`${emp.employeeId.toLowerCase()}@mwu-ems.app`} style={{ color: "var(--text-muted)", cursor: "text" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>Employee ID (Username)</label>
            <input className="input-base" readOnly value={emp.employeeId} style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input className="input-base" type={showCur ? "text" : "password"} value={curPass} onChange={(e) => setCurPass(e.target.value)} placeholder="Enter current password" />
              <button type="button" className="btn btn-ghost" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", padding: "4px 6px" }} onClick={() => setShowCur(!showCur)}>
                {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>New Password</label>
            <div style={{ position: "relative" }}>
              <input className="input-base" type={showPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Enter new password" />
              <button type="button" className="btn btn-ghost" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", padding: "4px 6px" }} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn btn-primary" style={{ flex: 1, gap: 6 }} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            {saving ? "Saving…" : "Update Password"}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}


function ConfirmDialog({
  message, onConfirm, onCancel, danger = false,
}: {
  message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ padding: 28, width: 380, boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 24, color: "var(--text-primary)" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? "" : "btn-primary"}`}
            style={danger ? { background: "var(--accent-red)", color: "#fff", border: "none" } : {}}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Three-dot action dropdown (portal-based, never clipped) ─── */
function ActionMenu({
  emp,
  onView,
  onCredentials,
  onRefresh,
}: {
  emp: EmpRow;
  onView: () => void;
  onCredentials: () => void;
  onRefresh?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "deactivate" | "activate" | "delete">(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* Open: compute button position for the portal */
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top:   rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  /* Click-outside: close if click is not inside button or portal */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current  && !btnRef.current.contains(target) &&
        dropRef.current && !dropRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleDeactivate = async () => {
    try {
      await updateDoc(doc(db, "employees", emp.id), {
        status: emp.status === "Active" ? "Inactive" : "Active",
        updatedAt: serverTimestamp(),
      });
      toast.success(
        `${emp.firstName} ${emp.status === "Active" ? "deactivated" : "activated"} successfully`
      );
      onRefresh?.();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await updateDoc(doc(db, "employees", emp.id), {
        status: "Archived",
        updatedAt: serverTimestamp(),
      });
      toast.success(`${emp.firstName} archived successfully`);
      onRefresh?.();
    } catch {
      toast.error("Failed to archive employee");
    }
  };

  const items = [
    {
      icon: Eye,      label: "View Profile",
      action: () => { setOpen(false); onView(); },
      danger: false, divider: false,
    },
    {
      icon: KeyRound, label: "View Credentials",
      action: () => { setOpen(false); onCredentials(); },
      danger: false, divider: false,
    },
    {
      icon: Mail,  label: "Send Email",
      action: () => { setOpen(false); window.location.href = `mailto:${emp.email}`; },
      danger: false, divider: false,
    },
    {
      icon: Phone, label: "Call",
      action: () => { setOpen(false); window.location.href = `tel:${emp.phone}`; },
      danger: false, divider: true,
    },
    {
      icon: emp.status === "Active" ? XCircle : CheckCircle,
      label: emp.status === "Active" ? "Deactivate" : "Activate",
      action: () => { setOpen(false); setConfirm(emp.status === "Active" ? "deactivate" : "activate"); },
      danger: emp.status === "Active", divider: false,
    },
    {
      icon: Trash2, label: "Archive",
      action: () => { setOpen(false); setConfirm("delete"); },
      danger: true, divider: false,
    },
  ];

  return (
    <>
      {/* Confirm dialogs render at fragment level — always above everything */}
      {confirm === "deactivate" && (
        <ConfirmDialog
          message={`Deactivate ${emp.firstName} ${emp.lastName}? They will lose portal access.`}
          onConfirm={() => { setConfirm(null); handleDeactivate(); }}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}
      {confirm === "activate" && (
        <ConfirmDialog
          message={`Reactivate ${emp.firstName} ${emp.lastName}? They will regain portal access.`}
          onConfirm={() => { setConfirm(null); handleDeactivate(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          message={`Archive ${emp.firstName} ${emp.lastName}? This removes them from active listings.`}
          onConfirm={() => { setConfirm(null); handleDelete(); }}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}

      {/* Trigger button */}
      <button
        ref={btnRef}
        className="btn btn-ghost"
        style={{ padding: "6px 10px" }}
        onClick={handleOpen}
        title="More actions"
        id={`emp-action-${emp.id}`}
      >
        <MoreHorizontal size={15} />
      </button>

      {/* Portal dropdown — rendered at body, never clipped */}
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top:    menuPos.top,
            right:  menuPos.right,
            zIndex: 99999,
            background: "#fff",
            border: "1px solid rgba(9,9,9,0.15)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.08)",
            minWidth: 200,
            overflow: "hidden",
          }}
        >
          {items.map((item, idx) => (
            <div key={item.label}>
              {item.divider && idx > 0 && (
                <div style={{ height: 1, background: "rgba(9,9,9,0.08)", margin: "4px 0" }} />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); item.action(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "11px 16px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, textAlign: "left",
                  color: item.danger ? "#e53e3e" : "#090909",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.danger ? "rgba(229,62,62,0.08)" : "rgba(9,9,9,0.05)";
                }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const isAdmin = role === "super_admin" || role === "hr_admin";
  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [employees, setEmployees] = useState<EmpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [credEmp, setCredEmp] = useState<EmpRow | null>(null);
  const { departments } = useDepartments();

  // Redirect non-admins away
  useEffect(() => {
    if (role && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [role, isAdmin, router]);

  /* Real-time Firestore listener — newest first */
  useEffect(() => {
    let unsub = () => {};
    const q = query(collection(db, "employees"), orderBy("createdAt", "desc"));
    unsub = onSnapshot(
      q,
      (snap) => {
        const rows: EmpRow[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            employeeId:  data.employeeId  ?? "",
            firstName:   data.firstName   ?? "",
            lastName:    data.lastName    ?? "",
            email:       data.email       ?? "",
            phone:       data.phone       ?? "",
            department:  data.department  ?? "",
            designation: data.designation ?? "",
            status:      data.status      ?? "Active",
            joiningDate: data.joiningDate ?? "",
            salary:      data.salary      ?? 0,
            uid:         data.uid         ?? "",
            password:    data.password    ?? "",
          };
        });
        setEmployees(rows);
        setLoading(false);
      },
      () => {
        setEmployees([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = employees.filter((e) => {
    if (e.status === "Archived" && status !== "Archived") return false;
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || e.email.includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchDept   = dept   === "All" || e.department === dept;
    const matchStatus = status === "All" || e.status === status;
    return matchSearch && matchDept && matchStatus;
  });

  if (!isAdmin && role) return null;

  return (
    <div className="page-container">
      {/* Credentials Modal */}
      {credEmp && (
        <CredentialsModal emp={credEmp} onClose={() => setCredEmp(null)} />
      )}
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.filter(e => e.status !== "Archived").length} active employees across all departments</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" style={{ gap: 6 }} id="employees-export"
            onClick={() => {
              if (filtered.length === 0) { toast.error("No employees to export"); return; }
              const headers = ["Employee ID","First Name","Last Name","Email","Phone","Department","Designation","Status","Joining Date","Salary"];
              const rows = filtered.map((e) => [
                e.employeeId, e.firstName, e.lastName, e.email, e.phone,
                e.department, e.designation, e.status, e.joiningDate, e.salary,
              ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
              const csv = [headers.join(","), ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href     = url;
              a.download = `employees_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success(`Exported ${filtered.length} employee${filtered.length > 1 ? "s" : ""} to CSV`);
            }}>
            <Download size={14} /> Export
          </button>

          <button className="btn btn-primary" style={{ gap: 6 }} id="employees-add" onClick={() => router.push("/employees/add")}>
            <UserPlus size={14} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="employees-search"
            type="text"
            placeholder="Search by name, ID, email…"
            className="input-base"
            style={{ paddingLeft: 32, paddingTop: 8, paddingBottom: 8 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select
            id="employees-filter-dept"
            className="input-base"
            style={{ paddingRight: 32, appearance: "none", minWidth: 160 }}
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        </div>

        <div style={{ position: "relative" }}>
          <select
            id="employees-filter-status"
            className="input-base"
            style={{ paddingRight: 32, appearance: "none", minWidth: 130 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["All", "Active", "Inactive", "Archived"].map((s) => <option key={s} value={s}>{s === "All" ? "All Status" : s}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: 3, border: "1px solid var(--border)" }}>
          <button id="view-table" onClick={() => setView("table")} className={`btn ${view === "table" ? "btn-primary" : "btn-ghost"}`} style={{ padding: "5px 10px" }}>
            <List size={14} />
          </button>
          <button id="view-card" onClick={() => setView("card")} className={`btn ${view === "card" ? "btn-primary" : "btn-ghost"}`} style={{ padding: "5px 10px" }}>
            <LayoutGrid size={14} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
          <Filter size={13} /> {filtered.length} results
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "var(--text-muted)", gap: 10 }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: 13 }}>Loading employees…</span>
        </div>
      )}

      {/* Table View */}
      {!loading && view === "table" && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/employees/${e.id}`)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent-blue-dim)", border: "1px solid var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--accent-blue)", flexShrink: 0 }}>
                        {getInitials(`${e.firstName} ${e.lastName}`)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{e.firstName} {e.lastName}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{e.employeeId}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={12} color="var(--text-muted)" /> {e.department}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{e.designation}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{e.joiningDate ? formatDate(e.joiningDate) : "—"}</td>
                  <td>
                    <span className="badge" style={{ background: statusBg[e.status] ?? "rgba(255,255,255,0.06)", color: statusColor[e.status] ?? "var(--text-muted)" }}>
                      {e.status}
                    </span>
                  </td>
                  <td onClick={(ev) => ev.stopPropagation()} style={{ overflow: "visible", position: "relative" }}>
                    <ActionMenu
                      emp={e}
                      onView={() => router.push(`/employees/${e.id}`)}
                      onCredentials={() => setCredEmp(e)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {!loading && view === "card" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map((e) => (
            <div
              key={e.id} className="card" style={{ padding: "20px", cursor: "pointer", transition: "border-color 0.15s" }}
              onClick={() => router.push(`/employees/${e.id}`)}
              onMouseEnter={(el) => (el.currentTarget.style.borderColor = "var(--text-primary)")}
              onMouseLeave={(el) => (el.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-blue-dim)", border: "1px solid var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--accent-blue)" }}>
                  {getInitials(`${e.firstName} ${e.lastName}`)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.firstName} {e.lastName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.employeeId}</div>
                </div>
                <span className="badge" style={{ background: statusBg[e.status] ?? "rgba(255,255,255,0.06)", color: statusColor[e.status] ?? "var(--text-muted)" }}>{e.status}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{e.designation}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.department}</div>
              <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`mailto:${e.email}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "6px 8px", fontSize: 12 }}><Mail size={12} /> Email</a>
                <a href={`tel:${e.phone}`}  className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "6px 8px", fontSize: 12 }}><Phone size={12} /> Call</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
          <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No employees match your filters</p>
        </div>
      )}
    </div>
  );
}
