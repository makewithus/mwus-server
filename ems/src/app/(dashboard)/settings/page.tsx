"use client";
import { useState, useEffect } from "react";
import {
  Building2, Shield, CalendarDays, DollarSign, Mail, Palette,
  X, Check, Save, User, Plus, Trash2, Tags, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useDepartments } from "@/hooks/useDepartments";

/* ─── Permission matrix ─── */
type PermissionKey =
  | "view_employees" | "manage_employees" | "view_payroll" | "manage_payroll"
  | "view_leaves" | "manage_leaves" | "view_tasks" | "manage_tasks"
  | "view_notices" | "manage_notices" | "view_reports" | "manage_settings"
  | "view_documents" | "manage_documents" | "view_attendance";

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view_employees: "View Employees", manage_employees: "Manage Employees (Add/Edit/Deactivate)",
  view_payroll: "View Payroll", manage_payroll: "Manage Payroll (Generate/Edit)",
  view_leaves: "View Leave Requests", manage_leaves: "Manage Leaves (Approve/Reject)",
  view_tasks: "View Tasks", manage_tasks: "Manage Tasks (Assign/Edit)",
  view_notices: "View Notices", manage_notices: "Post/Edit Notices",
  view_reports: "View Reports & Analytics", manage_settings: "Manage System Settings",
  view_documents: "View Documents", manage_documents: "Upload/Delete Documents",
  view_attendance: "View Attendance",
};

const PERM_SECTIONS: { label: string; keys: PermissionKey[] }[] = [
  { label: "Employees",  keys: ["view_employees", "manage_employees"] },
  { label: "Payroll",    keys: ["view_payroll", "manage_payroll"] },
  { label: "Leaves",     keys: ["view_leaves", "manage_leaves"] },
  { label: "Tasks",      keys: ["view_tasks", "manage_tasks"] },
  { label: "Notices",    keys: ["view_notices", "manage_notices"] },
  { label: "Reports",    keys: ["view_reports"] },
  { label: "Settings",   keys: ["manage_settings"] },
  { label: "Documents",  keys: ["view_documents", "manage_documents"] },
  { label: "Attendance", keys: ["view_attendance"] },
];

type RolePerms = Record<PermissionKey, boolean>;
const DEFAULT_PERMS: Record<string, RolePerms> = {
  "Super Admin": { view_employees:true,manage_employees:true,view_payroll:true,manage_payroll:true,view_leaves:true,manage_leaves:true,view_tasks:true,manage_tasks:true,view_notices:true,manage_notices:true,view_reports:true,manage_settings:true,view_documents:true,manage_documents:true,view_attendance:true },
  "HR Admin":    { view_employees:true,manage_employees:true,view_payroll:true,manage_payroll:true,view_leaves:true,manage_leaves:true,view_tasks:true,manage_tasks:true,view_notices:true,manage_notices:true,view_reports:true,manage_settings:false,view_documents:true,manage_documents:true,view_attendance:true },
  "Employee":    { view_employees:false,manage_employees:false,view_payroll:true,manage_payroll:false,view_leaves:true,manage_leaves:false,view_tasks:true,manage_tasks:false,view_notices:true,manage_notices:false,view_reports:false,manage_settings:false,view_documents:true,manage_documents:false,view_attendance:true },
};

function PermissionsModal({ role, onClose }: { role: string; onClose: () => void }) {
  const [perms, setPerms] = useState<RolePerms>({ ...DEFAULT_PERMS[role] });
  const isSuperAdmin = role === "Super Admin";
  const toggle = (key: PermissionKey) => { if (!isSuperAdmin) setPerms((p) => ({ ...p, [key]: !p[key] })); };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200 }} onClick={onClose}>
      <div className="card" style={{ padding:0,width:560,maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden" }} onClick={(e)=>e.stopPropagation()}>
        <div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div><div style={{ fontSize:15,fontWeight:700 }}>Configure Permissions — {role}</div><div style={{ fontSize:12,color:"var(--text-muted)",marginTop:2 }}>{isSuperAdmin?"Super Admin has full access (locked)":"Toggle access for this role"}</div></div>
          <button className="btn btn-ghost" style={{ padding:"6px 8px" }} onClick={onClose}><X size={16}/></button>
        </div>
        <div style={{ overflowY:"auto",flex:1 }}>
          {PERM_SECTIONS.map((s)=>(
            <div key={s.label} style={{ padding:"16px 24px",borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontSize:11,fontWeight:600,color:"var(--text-muted)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12 }}>{s.label}</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {s.keys.map((key)=>{
                  const enabled=perms[key];
                  return (
                    <div key={key} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"var(--radius-sm)",background:"var(--bg-elevated)",border:"1px solid var(--border)" }}>
                      <span style={{ fontSize:13 }}>{PERMISSION_LABELS[key]}</span>
                      <button onClick={()=>toggle(key)} disabled={isSuperAdmin} style={{ width:44,height:24,borderRadius:99,border:"none",cursor:isSuperAdmin?"default":"pointer",background:enabled?"var(--accent-blue)":"var(--bg-primary)",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.1)",position:"relative",transition:"background 0.2s",flexShrink:0 }}>
                        <span style={{ position:"absolute",top:3,left:enabled?"calc(100% - 21px)":3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.4)" }}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ gap:6 }} onClick={()=>{ toast.success(`Permissions for ${role} saved!`); onClose(); }}><Save size={14}/>Save Permissions</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Categories tab ─── */
function CategoriesContent() {
  const { departments, loading, addDepartment, removeDepartment } = useDepartments();
  const [newDept, setNewDept] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newDept.trim()) return;
    setSaving(true);
    const ok = await addDepartment(newDept.trim());
    if (ok) { toast.success(`"${newDept.trim()}" added`); setNewDept(""); }
    else toast.error("Already exists or invalid name");
    setSaving(false);
  };

  const handleRemove = async (name: string) => {
    await removeDepartment(name);
    toast.success(`"${name}" removed`);
  };

  return (
    <div>
      <h2 style={{ fontSize:16,fontWeight:700,marginBottom:6 }}>Department Categories</h2>
      <p style={{ fontSize:13,color:"var(--text-secondary)",marginBottom:20 }}>These categories appear in all department dropdowns across the system.</p>
      <div style={{ display:"flex",gap:10,marginBottom:20 }}>
        <input className="input-base" style={{ flex:1 }} placeholder="New department name…" value={newDept} onChange={(e)=>setNewDept(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter") handleAdd(); }}/>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={handleAdd} disabled={saving}><Plus size={14}/>Add</button>
      </div>
      {loading ? <div style={{ display:"flex",alignItems:"center",gap:8,color:"var(--text-muted)",fontSize:13 }}><Loader2 size={15} className="animate-spin"/>Loading…</div> : (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {departments.map((d)=>(
            <div key={d} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--bg-elevated)",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)" }}>
              <span style={{ fontSize:13,fontWeight:500 }}>{d}</span>
              <button className="btn btn-ghost" style={{ padding:"4px 8px",color:"var(--accent-red)" }} onClick={()=>handleRemove(d)} title="Remove"><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Company Settings ─── */
type CompanyData = { name:string; email:string; startTime:string; endTime:string; phone:string; address:string };
const COMPANY_DEFAULTS: CompanyData = { name:"", email:"", startTime:"09:00", endTime:"18:00", phone:"", address:"" };

function CompanySettingsContent({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<CompanyData>(COMPANY_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "company")).then((snap) => {
      if (snap.exists()) setData({ ...COMPANY_DEFAULTS, ...snap.data() } as CompanyData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "company"), { ...data, updatedAt: serverTimestamp() });
      toast.success("Company details saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { toast.error("Failed to save. Check Firestore rules."); }
    setSaving(false);
  };

  const set = (k: keyof CompanyData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData((prev) => ({ ...prev, [k]: e.target.value }));

  if (loading) return <div style={{ display:"flex",alignItems:"center",gap:8,color:"var(--text-muted)",fontSize:13 }}><Loader2 size={15} className="animate-spin"/>Loading…</div>;

  return (
    <div>
      <h2 style={{ fontSize:16,fontWeight:700,marginBottom:16 }}>Company Details</h2>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
        {[
          { label:"Company Name",    k:"name",      type:"text",  ph:"MakeWithUs Pvt Ltd" },
          { label:"Corporate Email", k:"email",     type:"email", ph:"hr@company.com" },
          { label:"Phone Number",    k:"phone",     type:"tel",   ph:"+91 XXXXX XXXXX" },
          { label:"Work Hours (Start)",k:"startTime",type:"time",  ph:"" },
          { label:"Work Hours (End)",  k:"endTime",  type:"time",  ph:"" },
        ].map((f) => (
          <div key={f.k}>
            <label style={{ fontSize:13,color:"var(--text-secondary)",display:"block",marginBottom:6 }}>{f.label}</label>
            <input className="input-base" type={f.type} placeholder={f.ph} value={(data as Record<string, string>)[f.k]} onChange={set(f.k as keyof CompanyData)} readOnly={!isAdmin} disabled={!isAdmin}/>
          </div>
        ))}
        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ fontSize:13,color:"var(--text-secondary)",display:"block",marginBottom:6 }}>Address</label>
          <textarea className="input-base" rows={2} placeholder="Company address…" value={data.address} onChange={set("address")} readOnly={!isAdmin} disabled={!isAdmin}/>
        </div>
      </div>
      {isAdmin && (
        <button className="btn btn-primary" style={{ gap:6 }} onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin"/> : saved ? <Check size={14}/> : <Save size={14}/>}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Company Details"}
        </button>
      )}
    </div>
  );
}

/* ─── Payroll Rules ─── */
function PayrollRulesContent() {
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <h2 style={{ fontSize:16,fontWeight:700,marginBottom:16 }}>Payroll Rules</h2>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
        {[{label:"PF Contribution (%)",id:"pr-pf",def:"12"},{label:"Professional Tax (monthly ₹)",id:"pr-pt",def:"200"},{label:"TDS Rate (%)",id:"pr-tds",def:"10"},{label:"Salary Day of Month",id:"pr-day",def:"1"}].map((f)=>(
          <div key={f.id}><label style={{ fontSize:13,color:"var(--text-secondary)",display:"block",marginBottom:6 }}>{f.label}</label><input id={f.id} className="input-base" type="number" defaultValue={f.def}/></div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ gap:6 }} onClick={()=>{ toast.success("Payroll rules updated!"); setSaved(true); setTimeout(()=>setSaved(false),2000); }}>
        {saved?<Check size={14}/>:<Save size={14}/>}{saved?"Saved!":"Save Payroll Rules"}
      </button>
    </div>
  );
}

/* ─── Theme ─── */
function ThemeContent() {
  const [accent, setAccent] = useState("");
  useEffect(()=>{ const c=getComputedStyle(document.documentElement).getPropertyValue("--accent-blue").trim(); if(c) setAccent(c); },[]);
  return (
    <div>
      <h2 style={{ fontSize:16,fontWeight:700,marginBottom:16 }}>Theme Options</h2>
      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:13,color:"var(--text-secondary)",display:"block",marginBottom:6 }}>Accent Color</label>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:12 }}>
          {["#3B82F6","#A855F7","#22C55E","#F59E0B","#EF4444","#06B6D4"].map((c)=>(
            <button key={c} onClick={()=>setAccent(c)} style={{ width:36,height:36,borderRadius:"50%",background:c,border:"none",cursor:"pointer",boxShadow:accent===c?"0 0 0 3px rgba(255,255,255,0.3)":"none",transition:"box-shadow 0.15s" }}/>
          ))}
        </div>
        <input className="input-base" type="color" value={accent} onChange={(e)=>setAccent(e.target.value)} style={{ width:100,height:36,padding:4 }}/>
      </div>
      <button className="btn btn-primary" style={{ gap:6 }} onClick={()=>{ document.documentElement.style.setProperty("--accent-blue",accent); toast.success("Theme saved!"); }}><Save size={14}/>Save Theme</button>
    </div>
  );
}

/* ─── Personal Info ─── */
function PersonalInfoContent() {
  const { profile, user } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [empData, setEmpData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingEmp, setLoadingEmp] = useState(true);

  useEffect(() => {
    const employeeId = profile?.employeeId;
    if (!employeeId || !user?.uid) { setLoadingEmp(false); return; }
    // Load from employees collection and fallback/check user doc
    import("firebase/firestore").then(({ collection: col, query: q, where: w, getDocs, doc: fsDoc, getDoc }) => {
      getDoc(fsDoc(db, "users", user.uid)).then((userSnap) => {
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        getDocs(q(col(db, "employees"), w("employeeId", "==", employeeId), w("uid", "==", user.uid)))
          .then((snap) => {
            if (!snap.empty) {
              const d = snap.docs[0].data();
              setEmpData({
                firstName:      d.firstName      ?? "",
                lastName:       d.lastName       ?? "",
                email:          d.email          ?? "",
                phone:          userData.phone   || d.phone || "",
                dob:            d.dob            ?? "",
                gender:         d.gender         ?? "",
                department:     d.department     ?? "",
                designation:    d.designation    ?? "",
                joiningDate:    d.joiningDate    ?? "",
                employeeId:     d.employeeId     ?? "",
                employmentType: d.employmentType ?? "",
              });
              setPhone(userData.phone || d.phone || "");
            }
            setLoadingEmp(false);
          })
          .catch(() => setLoadingEmp(false));
      }).catch(() => setLoadingEmp(false));
    });
  }, [profile?.employeeId, user?.uid]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { collection: col, query: q, where: w, getDocs, doc: fsDoc, updateDoc, serverTimestamp: sts } = await import("firebase/firestore");
      const employeeId = profile?.employeeId;
      
      // Try to update the employees collection. Catch any permission errors since employees may have write-restrictions in production.
      if (employeeId && user?.uid) {
        try {
          const snap = await getDocs(q(col(db, "employees"), w("employeeId", "==", employeeId), w("uid", "==", user.uid)));
          if (!snap.empty) {
            await updateDoc(fsDoc(db, "employees", snap.docs[0].id), { phone, updatedAt: sts() });
          }
        } catch (err) {
          console.warn("Direct update on employees doc restricted by Firestore security rules, falling back to users doc:", err);
        }
      }

      // Always update the users collection which is fully writable by the owner.
      if (user?.uid) {
        const { doc: fsDoc2, updateDoc: upDoc } = await import("firebase/firestore");
        await upDoc(fsDoc2(db, "users", user.uid), { phone, updatedAt: sts() });
      }
      
      toast.success("Profile updated!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save changes:", err);
      toast.error("Failed to save. Try again.");
    }
    setSaving(false);
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ padding: "12px 14px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>My Profile</h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Your personal information and employment details.</p>

      {loadingEmp ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
          <Loader2 size={15} className="animate-spin" /> Loading profile…
        </div>
      ) : (
        <>
          {/* Read-only details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <Row label="First Name"       value={empData.firstName} />
            <Row label="Last Name"        value={empData.lastName} />
            <Row label="Employee ID"      value={empData.employeeId} />
            <Row label="Login Email"      value={empData.email || `${empData.employeeId?.toLowerCase()}@mwu-ems.app`} />
            <Row label="Department"       value={empData.department} />
            <Row label="Designation"      value={empData.designation} />
            <Row label="Employment Type"  value={empData.employmentType} />
            <Row label="Joining Date"     value={empData.joiningDate} />
            <Row label="Date of Birth"    value={empData.dob} />
            <Row label="Gender"           value={empData.gender} />
          </div>

          {/* Editable field: Phone */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12 }}>Update Contact</h3>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Phone Number</label>
            <input
              className="input-base"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              style={{ maxWidth: 280 }}
            />
          </div>

          <button className="btn btn-primary" style={{ gap: 6 }} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Main Settings Page ─── */
export default function SettingsPage() {
  const { role } = useAuthStore();
  const isAdmin = role === "super_admin" || role === "hr_admin";
  const [activeTab, setActiveTab] = useState(isAdmin ? "company" : "personal");
  const [permRole, setPermRole] = useState<string|null>(null);
  const [leaveSaved, setLeaveSaved] = useState(false);

  const allTabs = [
    { id:"personal",    label:"Personal Info",        icon:User,         show:true },
    { id:"company",     label:"Company Settings",     icon:Building2,    show:true },
    { id:"categories",  label:"Department Categories",icon:Tags,         show:isAdmin },
    { id:"permissions", label:"Permissions & Roles",  icon:Shield,       show:isAdmin },
    { id:"leavePolicy", label:"Leave Policy",         icon:CalendarDays, show:isAdmin },
    { id:"payrollRules",label:"Payroll Rules",        icon:DollarSign,   show:isAdmin },
    { id:"emailConfig", label:"Email Configuration",  icon:Mail,         show:isAdmin },
    { id:"themeConfig", label:"Theme Options",        icon:Palette,      show:true },
  ];
  const visibleTabs = allTabs.filter((t) => t.show);

  return (
    <div className="page-container">
      {permRole && <PermissionsModal role={permRole} onClose={() => setPermRole(null)} />}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">{isAdmin ? "Configure organization rules, policy structures, and app appearance" : "Manage your personal information and app appearance"}</p>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"240px 1fr",gap:20 }}>
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:"var(--radius-sm)",background:isActive?"var(--accent-blue-dim)":"transparent",border:"none",cursor:"pointer",color:isActive?"var(--accent-blue)":"var(--text-secondary)",textAlign:"left",fontSize:13.5,fontWeight:isActive?600:400,transition:"all 0.15s" }}>
                <Icon size={16}/>{tab.label}
              </button>
            );
          })}
        </div>

        <div className="card" style={{ padding:24 }}>
          {activeTab === "personal"    && <PersonalInfoContent />}
          {activeTab === "company"     && <CompanySettingsContent isAdmin={isAdmin} />}
          {activeTab === "categories"  && isAdmin && <CategoriesContent />}
          {activeTab === "permissions" && isAdmin && (
            <div>
              <h2 style={{ fontSize:16,fontWeight:700,marginBottom:8 }}>Role Editor & Permissions</h2>
              <p style={{ fontSize:13,color:"var(--text-secondary)",marginBottom:20 }}>Define what different user roles can access within the system.</p>
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {[{role:"Super Admin",desc:"Full access & system configurations",locked:true},{role:"HR Admin",desc:"Operational HR access, Leaves, Payroll, Notices",locked:false},{role:"Employee",desc:"Read-only access, self-service dashboard",locked:false}].map(({role,desc})=>(
                  <div key={role} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,background:"var(--bg-elevated)",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)" }}>
                    <div><div style={{ fontSize:13.5,fontWeight:600 }}>{role} Role</div><div style={{ fontSize:11,color:"var(--text-muted)",marginTop:2 }}>{desc}</div></div>
                    <button className="btn btn-secondary" style={{ padding:"6px 14px",fontSize:12,gap:6 }} onClick={()=>setPermRole(role)}><Shield size={12}/>Configure Permissions</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "leavePolicy" && isAdmin && (
            <div>
              <h2 style={{ fontSize:16,fontWeight:700,marginBottom:16 }}>Leave Policy Setup</h2>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
                {[{label:"Casual Leaves Yearly",id:"lv-cas",def:"12"},{label:"Medical Leaves Yearly",id:"lv-med",def:"10"},{label:"Paid Leaves Yearly",id:"lv-paid",def:"15"},{label:"Emergency Leaves",id:"lv-emer",def:"5"}].map((f)=>(
                  <div key={f.id}><label style={{ fontSize:13,color:"var(--text-secondary)",display:"block",marginBottom:6 }}>{f.label}</label><input id={f.id} className="input-base" type="number" defaultValue={f.def}/></div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ gap:6 }} onClick={()=>{ toast.success("Leave policies updated!"); setLeaveSaved(true); setTimeout(()=>setLeaveSaved(false),2000); }}>
                {leaveSaved?<Check size={14}/>:<Save size={14}/>}{leaveSaved?"Saved!":"Update Policies"}
              </button>
            </div>
          )}
          {activeTab === "payrollRules" && <PayrollRulesContent />}
          {activeTab === "emailConfig" && isAdmin && (
            <div>
              <h2 style={{ fontSize:16,fontWeight:700,marginBottom:16 }}>Email Configuration</h2>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
                {[{label:"SMTP Host",id:"em-host",def:"smtp.gmail.com",type:"text"},{label:"SMTP Port",id:"em-port",def:"587",type:"number"},{label:"Sender Email",id:"em-from",def:"hr@company.com",type:"email"},{label:"Sender Name",id:"em-name",def:"HR Team",type:"text"}].map((f)=>(
                  <div key={f.id}><label style={{ fontSize:13,color:"var(--text-secondary)",display:"block",marginBottom:6 }}>{f.label}</label><input id={f.id} className="input-base" type={f.type} defaultValue={f.def}/></div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ gap:6 }} onClick={()=>toast.success("Email configuration saved!")}><Save size={14}/>Save Config</button>
            </div>
          )}
          {activeTab === "themeConfig" && <ThemeContent />}
        </div>
      </div>
    </div>
  );
}
