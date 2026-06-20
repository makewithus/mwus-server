"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, UserCheck, UserX, Mail, Phone,
  MapPin, Building2, Calendar, DollarSign, Loader2,
  Save, X, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { formatDate, getInitials, formatCurrency, EMPLOYMENT_TYPES } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, updateDoc, serverTimestamp
} from "firebase/firestore";
import { updateEmployeeAuth } from "@/lib/firebase-secondary";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

/* ── Types ────────────────────────────────────────────────── */
type Emp = {
  id: string;
  uid?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  department: string;
  designation: string;
  joiningDate: string;
  employmentType: string;
  salary: number;
  status: string;
  password?: string;
};

const TABS = ["Overview", "Attendance", "Leaves", "Payroll", "Documents", "Tasks", "Activity"];

/* ── Inline edit modal ────────────────────────────────────── */
function EditModal({ emp, onClose, onSaved }: { emp: Emp; onClose: () => void; onSaved: (updated: Emp) => void }) {
  const [form, setForm] = useState<Emp>({ ...emp });
  const [saving, setSaving] = useState(false);
  const { departments } = useDepartments();

  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState(emp.password || "");
  const [showPass, setShowPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);

  const set = (k: keyof Emp, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required"); return;
    }

    const credentialsChanged =
      form.employeeId !== emp.employeeId ||
      newPassword.trim() !== "";

    if (credentialsChanged) {
      if (!currentPassword.trim()) {
        toast.error("Current password of the employee is required to modify credentials.");
        return;
      }
    }

    setSaving(true);
    try {
      let updatedEmail = form.email;
      let passwordToSave = form.password || "";

      if (credentialsChanged) {
        // Update credentials in Auth
        const res = await updateEmployeeAuth(
          emp.employeeId,
          currentPassword,
          form.employeeId,
          newPassword
        );
        updatedEmail = res.email;
        passwordToSave = newPassword.trim() || currentPassword;
      }

      // Update employee record
      await updateDoc(doc(db, "employees", emp.id), {
        firstName:      form.firstName.trim(),
        lastName:       form.lastName.trim(),
        email:          updatedEmail,
        phone:          form.phone.trim(),
        dob:            form.dob,
        gender:         form.gender,
        address:        form.address.trim(),
        department:     form.department,
        designation:    form.designation.trim(),
        joiningDate:    form.joiningDate,
        employmentType: form.employmentType,
        salary:         Number(form.salary),
        employeeId:     form.employeeId,
        password:       passwordToSave,
        updatedAt:      serverTimestamp(),
      });

      // Update user profile record as well if uid exists
      if (emp.uid) {
        await updateDoc(doc(db, "users", emp.uid), {
          email:          updatedEmail,
          displayName:    `${form.firstName} ${form.lastName}`.trim(),
          employeeId:     form.employeeId,
          updatedAt:      serverTimestamp(),
        });
      }

      toast.success("Employee updated successfully!");
      onSaved({
        ...form,
        email: updatedEmail,
        password: passwordToSave
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save changes";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label, field, type = "text", options,
  }: {
    label: string;
    field: keyof Emp;
    type?: string;
    options?: string[];
  }) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {options ? (
        <div style={{ position: "relative" }}>
          <select
            className="input-base"
            style={{ appearance: "none", paddingRight: 32 }}
            value={String(form[field])}
            onChange={(e) => set(field, e.target.value)}
          >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
        </div>
      ) : (
        <input
          type={type}
          className="input-base"
          value={String(form[field])}
          onChange={(e) => set(field, type === "number" ? Number(e.target.value) : e.target.value)}
        />
      )}
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: 32, width: 560, background: "var(--bg-primary)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Edit Employee</div>
          <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="First Name"       field="firstName" />
          <Field label="Last Name"        field="lastName" />
          <Field label="Email"            field="email" type="email" />
          <Field label="Phone"            field="phone" />
          <Field label="Designation"      field="designation" />
          <Field label="Department"       field="department" options={departments} />
          <Field label="Employment Type"  field="employmentType" options={[...EMPLOYMENT_TYPES]} />
          <Field label="Salary (₹)"       field="salary" type="number" />
          <Field label="Date of Birth"    field="dob" type="date" />
          <Field label="Joining Date"     field="joiningDate" type="date" />
          <Field label="Gender"           field="gender" options={["Male", "Female", "Other", "Prefer not to say"]} />
          <div style={{ gridColumn: "1/-1" }}>
            <Field label="Address" field="address" />
          </div>
          
          {/* Credentials Section */}
          <div style={{ gridColumn: "1/-1", borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12 }}>
              🔐 Portal Credentials
            </h3>
          </div>
          <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Employee ID (Username)
              </label>
              <input
                type="text"
                className="input-base"
                value={form.employeeId}
                onChange={(e) => set("employeeId", e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                New Password (Optional)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  className="input-base"
                  placeholder="Leave blank to keep current"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", padding: "4px 6px" }}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          {(!emp.password || form.employeeId !== emp.employeeId || newPassword.trim() !== "") && (
            <div style={{ gridColumn: "1/-1", marginTop: 8 }}>
              <div style={{ padding: "12px 14px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-sm)", marginBottom: 8 }}>
                <p style={{ fontSize: 11.5, color: "var(--accent-red)", fontWeight: 500 }}>
                  ⚠️ Authorization Required
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                  {emp.password
                    ? "Updating the Employee ID (Username) or Password requires authentication with their credentials."
                    : "This employee does not have a saved password in the system. You must enter their current password to authorize credentials changes or update their profile."}
                </p>
              </div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Current Employee Password *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPass ? "text" : "password"}
                  className="input-base"
                  placeholder="Enter employee's current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", padding: "4px 6px" }}
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                >
                  {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button className="btn btn-primary" style={{ flex: 1, gap: 6 }} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { role } = useAuthStore();
  const isAdmin = role === "super_admin" || role === "hr_admin";

  const [emp,       setEmp]       = useState<Emp | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("Overview");
  const [showEdit,  setShowEdit]  = useState(false);
  const [toggling,  setToggling]  = useState(false);

  /* ── Load employee from Firestore ── */
  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "employees", id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setEmp({
          id:             snap.id,
          uid:            d.uid            ?? "",
          employeeId:     d.employeeId     ?? "",
          firstName:      d.firstName      ?? "",
          lastName:       d.lastName       ?? "",
          email:          d.email          ?? "",
          phone:          d.phone          ?? "",
          dob:            d.dob            ?? "",
          gender:         d.gender         ?? "",
          address:        d.address        ?? "",
          department:     d.department     ?? "",
          designation:    d.designation    ?? "",
          joiningDate:    d.joiningDate    ?? "",
          employmentType: d.employmentType ?? "Full-time",
          salary:         d.salary         ?? 0,
          status:         d.status         ?? "Active",
          password:       d.password       ?? "",
        });
      } else {
        toast.error("Employee not found");
        router.replace("/employees");
      }
      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load employee");
      setLoading(false);
    });
  }, [id, router]);

  /* ── Toggle Active / Inactive ── */
  const handleToggleStatus = async () => {
    if (!emp || !isAdmin) return;
    const newStatus = emp.status === "Active" ? "Inactive" : "Active";
    setToggling(true);
    try {
      await updateDoc(doc(db, "employees", emp.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setEmp((p) => p ? { ...p, status: newStatus } : p);
      toast.success(`${emp.firstName} ${newStatus === "Active" ? "activated" : "deactivated"} successfully`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
        <span style={{ fontSize: 14 }}>Loading employee…</span>
      </div>
    );
  }

  if (!emp) return null;

  const isActive = emp.status === "Active";

  return (
    <div className="page-container">
      {/* Edit modal */}
      {showEdit && (
        <EditModal
          emp={emp}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setEmp(updated)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ textTransform: "uppercase" }}>
            {emp.firstName} {emp.lastName}
          </h1>
          <p className="page-subtitle">{emp.designation} · {emp.department}</p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-secondary"
              style={{ gap: 6 }}
              onClick={() => setShowEdit(true)}
              id="emp-edit-btn"
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              className={`btn ${isActive ? "btn-danger" : "btn-primary"}`}
              style={{ gap: 6 }}
              onClick={handleToggleStatus}
              disabled={toggling}
              id="emp-toggle-btn"
            >
              {toggling
                ? <Loader2 size={14} className="animate-spin" />
                : isActive ? <UserX size={14} /> : <UserCheck size={14} />}
              {toggling ? "Updating…" : isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "clamp(220px, 22%, 280px) 1fr", gap: 20 }}>
        {/* Left sidebar */}
        <div>
          {/* Avatar card */}
          <div className="card" style={{ padding: 24, textAlign: "center", marginBottom: 14 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: isActive ? "var(--accent-blue-dim)" : "rgba(9,9,9,0.08)",
              border: `2px solid ${isActive ? "var(--accent-blue)" : "var(--border-strong)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700,
              color: isActive ? "var(--accent-blue)" : "var(--text-muted)",
              margin: "0 auto 12px",
            }}>
              {getInitials(`${emp.firstName} ${emp.lastName}`)}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{emp.firstName} {emp.lastName}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{emp.employeeId}</div>
            <span
              className="badge"
              style={{
                background: isActive ? "var(--accent-green-dim)" : "var(--accent-red-dim)",
                color:      isActive ? "var(--accent-green)"     : "var(--accent-red)",
              }}
            >
              {emp.status}
            </span>
          </div>

          {/* Contact info card */}
          <div className="card" style={{ padding: 16 }}>
            {[
              { icon: Mail,       label: "Email",      value: emp.email,                   href: `mailto:${emp.email}` },
              { icon: Phone,      label: "Phone",      value: emp.phone,                   href: `tel:${emp.phone}` },
              { icon: MapPin,     label: "Address",    value: emp.address,                 href: undefined },
              { icon: Building2,  label: "Department", value: emp.department,              href: undefined },
              { icon: Calendar,   label: "Joining",    value: emp.joiningDate ? formatDate(emp.joiningDate) : "—", href: undefined },
              { icon: DollarSign, label: "Salary",     value: formatCurrency(emp.salary),  href: undefined },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", gap: 10, marginBottom: 13 }}>
                <item.icon size={13} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 1 }}>{item.label}</div>
                  {item.href ? (
                    <a href={item.href} style={{ fontSize: 13, color: "var(--text-primary)", textDecoration: "none" }}>{item.value || "—"}</a>
                  ) : (
                    <div style={{ fontSize: 13 }}>{item.value || "—"}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 20, overflowX: "auto" }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "9px 14px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? "var(--brand-red)" : "var(--text-secondary)",
                  borderBottom: `2px solid ${tab === t ? "var(--brand-red)" : "transparent"}`,
                  marginBottom: -1, whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "Overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Employment Type", emp.employmentType],
                ["Gender",          emp.gender || "—"],
                ["Date of Birth",   emp.dob ? formatDate(emp.dob) : "—"],
                ["Work Email",      emp.email],
                ["Department",      emp.department],
                ["Designation",     emp.designation],
                ["Joining Date",    emp.joiningDate ? formatDate(emp.joiningDate) : "—"],
                ["Monthly Salary",  formatCurrency(emp.salary)],
              ].map(([l, v]) => (
                <div key={l} className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {tab !== "Overview" && (
            <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{tab}</div>
              <div style={{ fontSize: 13 }}>Live {tab.toLowerCase()} data loads here from Firestore.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
