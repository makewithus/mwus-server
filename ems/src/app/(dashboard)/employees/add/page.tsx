"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Loader2, User, Briefcase, KeyRound, Check,
  Eye, EyeOff, Copy, CheckCheck, X,
} from "lucide-react";
import { EMPLOYMENT_TYPES } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, setDoc, doc, getDocs,
  serverTimestamp, query, orderBy, limit,
} from "firebase/firestore";
import { createEmployeeAuth } from "@/lib/firebase-secondary";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  firstName:      z.string().min(1, "Required"),
  lastName:       z.string().min(1, "Required"),
  phone:          z.string().optional(),
  dob:            z.string().optional(),
  gender:         z.string().optional(),
  address:        z.string().optional(),
  department:     z.string().min(1, "Required"),
  designation:    z.string().min(1, "Required"),
  joiningDate:    z.string().min(1, "Required"),
  employmentType: z.string().min(1, "Required"),
  salary:         z.coerce.number().min(1, "Required"),
  salaryDate:     z.coerce.number().min(1).max(31, "Must be between 1 and 31"),
  employeeId:     z.string().min(1, "Required"),
  password:       z.string()
                    .min(6, "Min 6 characters")
                    .regex(/[A-Z]/, "Requires at least one capital letter")
                    .regex(/[0-9]/, "Requires at least one number")
                    .regex(/[^A-Za-z0-9]/, "Requires at least one symbol"),
  confirmPassword:z.string().min(1, "Required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: "Personal Info",    icon: User },
  { id: 2, label: "Job Details",      icon: Briefcase },
  { id: 3, label: "Login Credentials",icon: KeyRound },
];

const Field = ({
  label, id, error, children,
}: { label: string; id: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
      {label}
    </label>
    {children}
    {error && <p style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 4 }}>{error}</p>}
  </div>
);

const RuleItem = ({ valid, label }: { valid: boolean; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: valid ? "var(--accent-green)" : "var(--accent-red)" }}>
    {valid ? <Check size={14} /> : <X size={14} />}
    <span>{label}</span>
  </div>
);

export default function AddEmployeePage() {
  const router = useRouter();
  const { companyId } = useAuthStore();
  const { departments } = useDepartments();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [savedCreds, setSavedCreds] = useState<{ employeeId: string; password: string } | null>(null);
  
  // States for toggling visibility
  const [showPass, setShowPass] = useState(false); // For credential card
  const [showInputPass, setShowInputPass] = useState(false); // For step 3 password field
  const [showConfirmPass, setShowConfirmPass] = useState(false); // For step 3 confirm password field
  
  const [copied, setCopied] = useState(false);
  const [nextEmpId, setNextEmpId] = useState("EMP0001");
  const [saving, setSaving] = useState(false);

  // Auto-generate next Employee ID
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const q = query(collection(db, "employees"), orderBy("createdAt", "desc"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const last = snap.docs[0].data();
          const lastId = last.employeeId as string;
          const num = parseInt(lastId.replace(/\D/g, ""), 10);
          if (!isNaN(num)) {
            setNextEmpId(`EMP${String(num + 1).padStart(4, "0")}`);
          } else {
            setNextEmpId("EMP0001");
          }
        } else {
          setNextEmpId("EMP0001");
        }
      } catch {
        setNextEmpId("EMP0001");
      }
    };
    fetchCount();
  }, []);

  const {
    register, handleSubmit, trigger, watch, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: nextEmpId },
  });

  // Sync auto-generated ID into form
  useEffect(() => {
    setValue("employeeId", nextEmpId);
  }, [nextEmpId, setValue]);

  const passwordValue = watch("password") || "";

  const passRules = {
    length: passwordValue.length >= 6,
    capital: /[A-Z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    symbol: /[^a-zA-Z0-9]/.test(passwordValue),
  };

  const nextStep = async () => {
    const fields: (keyof FormData)[][] = [
      ["firstName", "lastName", "phone", "dob", "gender", "address"],
      ["department", "designation", "joiningDate", "employmentType", "salary", "salaryDate"],
      ["employeeId", "password", "confirmPassword"],
    ];
    const ok = await trigger(fields[step - 1]);
    if (ok) setStep((s) => Math.min(s + 1, 3));
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      // 1. Create Firebase Auth account via secondary app (admin session unaffected)
      const { uid, email } = await createEmployeeAuth(data.employeeId, data.password);

      const cid = companyId ?? "default";
      const displayName = `${data.firstName} ${data.lastName}`;
      const now = serverTimestamp();

      // 2. Write UserProfile to /users/{uid}
      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        displayName,
        role: "employee",
        companyId: cid,
        employeeId: data.employeeId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      // 3. Write full Employee record to /employees
      await addDoc(collection(db, "employees"), {
        uid,
        companyId: cid,
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phone: data.phone ?? "",
        dob: data.dob ?? "",
        gender: data.gender ?? "",
        address: data.address ?? "",
        department: data.department,
        designation: data.designation,
        joiningDate: data.joiningDate,
        employmentType: data.employmentType,
        salary: data.salary,
        salaryDate: data.salaryDate,
        status: "Active",
        password: data.password,
        createdAt: now,
        updatedAt: now,
      });

      setSavedCreds({ employeeId: data.employeeId, password: data.password });
      setSubmitted(true);
      toast.success(`${displayName} onboarded successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create employee";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!savedCreds) return;
    const text = `EMS Portal Login\nEmployee ID: ${savedCreds.employeeId}\nPassword: ${savedCreds.password}\nLogin at: ${window.location.origin}/login/employee`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Credentials copied to clipboard!");
  };

  /* ───────── Success state ───────── */
  if (submitted && savedCreds) {
    return (
      <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 500 }}>
        <div style={{ textAlign: "center", maxWidth: 440, width: "100%" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--accent-green-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Check size={30} color="var(--accent-green)" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Employee Added!</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 28 }}>
            Share these login credentials with the employee via WhatsApp.
          </p>

          {/* Credential card */}
          <div className="card" style={{ padding: "22px 24px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
              🔐 Portal Login Credentials
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Employee ID (Username)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>{savedCreds.employeeId}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Password</div>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.1em" }}>
                    {showPass ? savedCreds.password : "•".repeat(savedCreds.password.length)}
                  </div>
                </div>
                <button type="button" className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div style={{ padding: "8px 14px", background: "var(--accent-blue-dim)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Login URL</div>
                <div style={{ fontSize: 12, color: "var(--accent-blue)", fontWeight: 500 }}>{typeof window !== "undefined" ? window.location.origin : ""}/login/employee</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, gap: 6 }}
              onClick={copyCredentials}
            >
              {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy for WhatsApp"}
            </button>
            <button className="btn btn-secondary" onClick={() => router.push("/employees")}>
              View Employees
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───────── Form ───────── */
  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">Add Employee</h1>
            <p className="page-subtitle">Fill in the details to onboard a new employee</p>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32, maxWidth: 600 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: step > s.id ? "var(--accent-green)" : step === s.id ? "var(--accent-blue)" : "var(--bg-elevated)",
                border: `2px solid ${step > s.id ? "var(--accent-green)" : step === s.id ? "var(--accent-blue)" : "var(--border-strong)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {step > s.id ? <Check size={16} color="#fff" /> : <s.icon size={16} color={step === s.id ? "#fff" : "var(--text-muted)"} />}
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: step >= s.id ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: step > s.id ? "var(--accent-green)" : "var(--border)", margin: "0 8px", marginBottom: 22, transition: "background 0.2s" }} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card" style={{ padding: 28, maxWidth: 700 }}>

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Field label="First Name *" id="firstName" error={errors.firstName?.message}>
                <input id="firstName" className="input-base" placeholder="Arjun" {...register("firstName")} />
              </Field>
              <Field label="Last Name *" id="lastName" error={errors.lastName?.message}>
                <input id="lastName" className="input-base" placeholder="Mehta" {...register("lastName")} />
              </Field>
              <Field label="Phone Number" id="phone">
                <input id="phone" className="input-base" placeholder="+91 98765 43210" {...register("phone")} />
              </Field>
              <Field label="Date of Birth" id="dob">
                <input id="dob" type="date" className="input-base" {...register("dob")} />
              </Field>
              <Field label="Gender" id="gender">
                <select id="gender" className="input-base" {...register("gender")}>
                  <option value="">Select gender</option>
                  {["Male", "Female", "Other", "Prefer not to say"].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <div />
              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Address" id="address">
                  <textarea id="address" className="input-base" rows={2} placeholder="Full address…" {...register("address")} />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 2: Job Details ── */}
          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Field label="Department *" id="department" error={errors.department?.message}>
                <select id="department" className="input-base" {...register("department")}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Designation *" id="designation" error={errors.designation?.message}>
                <input id="designation" className="input-base" placeholder="Senior Developer" {...register("designation")} />
              </Field>
              <Field label="Joining Date *" id="joiningDate" error={errors.joiningDate?.message}>
                <input id="joiningDate" type="date" className="input-base" {...register("joiningDate")} />
              </Field>
              <Field label="Employment Type *" id="employmentType" error={errors.employmentType?.message}>
                <select id="employmentType" className="input-base" {...register("employmentType")}>
                  <option value="">Select type</option>
                  {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Field label="Monthly Salary (₹) *" id="salary" error={errors.salary?.message}>
                  <input id="salary" type="number" className="input-base" placeholder="60000" {...register("salary")} />
                </Field>
                <Field label="Salary Credit Date (1-31) *" id="salaryDate" error={errors.salaryDate?.message}>
                  <input id="salaryDate" type="number" min="1" max="31" className="input-base" placeholder="1" {...register("salaryDate")} />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 3: Login Credentials ── */}
          {step === 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {/* Info banner */}
              <div style={{ gridColumn: "1/-1", padding: "14px 16px", background: "var(--accent-blue-dim)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(59,130,246,0.25)", marginBottom: 4 }}>
                <p style={{ fontSize: 13, color: "var(--accent-blue)", fontWeight: 500, marginBottom: 4 }}>
                  🔐 Setting employee portal credentials
                </p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  The Employee ID is the login username. Set a password and share it with the employee via WhatsApp. They can log in at <strong>/login/employee</strong>.
                </p>
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Employee ID (Username) *" id="empId" error={errors.employeeId?.message}>
                  <input
                    id="empId"
                    className="input-base"
                    placeholder="EMP0001"
                    {...register("employeeId")}
                  />
                </Field>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Auto-generated. You may customise it (e.g. EMP0009).
                </p>
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Password *" id="password" error={errors.password?.message}>
                  <div style={{ position: "relative" }}>
                    <input 
                      id="password" 
                      type={showInputPass ? "text" : "password"} 
                      className="input-base" 
                      style={{ paddingRight: 40 }}
                      placeholder="Enter strong password" 
                      {...register("password")} 
                    />
                    <button 
                      type="button"
                      className="btn btn-ghost" 
                      style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", padding: "4px 6px" }}
                      onClick={() => setShowInputPass(!showInputPass)}
                    >
                      {showInputPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, background: "var(--bg-elevated)", padding: 12, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <RuleItem valid={passRules.length} label="At least 6 characters" />
                  <RuleItem valid={passRules.capital} label="One capital letter" />
                  <RuleItem valid={passRules.number} label="One number" />
                  <RuleItem valid={passRules.symbol} label="One symbol" />
                </div>
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Confirm Password *" id="confirmPassword" error={errors.confirmPassword?.message}>
                  <div style={{ position: "relative" }}>
                    <input 
                      id="confirmPassword" 
                      type={showConfirmPass ? "text" : "password"} 
                      className="input-base" 
                      style={{ paddingRight: 40 }}
                      placeholder="Repeat password" 
                      {...register("confirmPassword")} 
                    />
                    <button 
                      type="button"
                      className="btn btn-ghost" 
                      style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", padding: "4px 6px" }}
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <button type="button" className="btn btn-secondary" onClick={() => step > 1 ? setStep((s) => s - 1) : router.back()}>
              {step === 1 ? "Cancel" : "← Back"}
            </button>
            {step < 3 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>Next →</button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={saving} id="add-employee-submit">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {saving ? "Creating account…" : "Add Employee"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
