"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FolderOpen, Upload, Search, Grid3X3, List, Star, Pin,
  FileText, Image, File, MoreHorizontal, Download, Eye,
  ChevronRight, X, Edit2, Trash2, Loader2, Info
} from "lucide-react";
import { fileSizeLabel, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth.store";

const FOLDERS = [
  { id: "1", name: "Employee Documents", icon: "👤" },
  { id: "2", name: "Offer Letters",       icon: "📄" },
  { id: "3", name: "Payslips",            icon: "💰" },
  { id: "4", name: "Certificates",        icon: "🏆" },
  { id: "5", name: "Contracts",           icon: "📝" },
  { id: "6", name: "ID Proof",            icon: "🪪" },
  { id: "7", name: "Company Policies",    icon: "📋" },
  { id: "8", name: "Training Material",   icon: "📚" },
  { id: "9", name: "HR Files",            icon: "🗂️" },
];

const FILE_ICON: Record<string, React.ReactNode> = {
  pdf:  <FileText size={18} color="var(--text-primary)" />,
  xlsx: <FileText size={18} color="var(--text-primary)" />,
  docx: <FileText size={18} color="var(--text-primary)" />,
  jpg:  <Image    size={18} color="var(--text-primary)" aria-label="Image file" />,
  png:  <Image    size={18} color="var(--text-primary)" aria-label="Image file" />,
};
const fileIcon = (t: string) => FILE_ICON[t] ?? <File size={18} color="var(--text-primary)" />;

type DocFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploader: string;
  date: string;
  dept: string;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  folderId: string;
};

/* ─── Confirm Delete Dialog ─── */
function ConfirmDialog({
  message, onConfirm, onCancel
}: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ padding: 28, width: 380, border: "1px solid var(--border-strong)", background: "var(--bg-primary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 24, color: "var(--text-primary)" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ background: "var(--accent-red)", color: "#fff", border: "none" }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Document Modal ─── */
function EditDocModal({
  file, onClose, onSave
}: {
  file: DocFile; onClose: () => void; onSave: (id: string, updated: Partial<DocFile>) => Promise<void>;
}) {
  const [name, setName] = useState(file.name);
  const [tagsInput, setTagsInput] = useState(file.tags.join(", "));
  const [folderId, setFolderId] = useState(file.folderId);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Document name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave(file.id, { name: name.trim(), tags, folderId });
      toast.success("Document updated successfully");
      onClose();
    } catch {
      toast.error("Failed to update document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999,
      }}
      onClick={onClose}
    >
      <form
        className="card"
        style={{ padding: 32, width: 440, background: "var(--bg-primary)" }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Edit Document</div>
          <button type="button" className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
              Document Name
            </label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project_Brief.pdf"
              disabled={saving}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
              Category / Folder
            </label>
            <select
              className="input-base"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              disabled={saving}
            >
              <option value="">No Folder (Root)</option>
              {FOLDERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.icon} {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
              Tags (comma separated)
            </label>
            <input
              className="input-base"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. billing, internal, q1"
              disabled={saving}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Portal-based Dropdown Action Menu ─── */
function ActionMenu({
  file,
  onPreview,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleFav,
}: {
  file: DocFile;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleFav: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropRef.current && !dropRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = [
    {
      icon: Eye,
      label: "Preview",
      action: () => { setOpen(false); onPreview(); },
      danger: false,
    },
    {
      icon: Edit2,
      label: "Edit Details",
      action: () => { setOpen(false); onEdit(); },
      danger: false,
    },
    {
      icon: Pin,
      label: file.pinned ? "Unpin Document" : "Pin Document",
      action: () => { setOpen(false); onTogglePin(); },
      danger: false,
    },
    {
      icon: Star,
      label: file.favorite ? "Remove Favourite" : "Add Favourite",
      action: () => { setOpen(false); onToggleFav(); },
      danger: false,
    },
    {
      icon: Download,
      label: "Download",
      action: () => {
        setOpen(false);
        toast.success(`Document "${file.name}" downloaded successfully!`);
      },
      danger: false,
    },
    {
      icon: Trash2,
      label: "Delete",
      action: () => { setOpen(false); onDelete(); },
      danger: true,
    },
  ];

  return (
    <>
      <button
        ref={btnRef}
        className="btn btn-ghost"
        style={{ padding: "4px 8px" }}
        onClick={handleOpen}
        title="Actions"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            zIndex: 99999,
            background: "#fff",
            border: "1px solid rgba(9,9,9,0.15)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.08)",
            minWidth: 180,
            overflow: "hidden",
          }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => { e.stopPropagation(); item.action(); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 16px",
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
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export default function DocumentsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [specialFilter, setSpecialFilter] = useState<"all" | "favorites" | "pinned">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<DocFile | null>(null);

  const [uploadName, setUploadName] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadFolder, setUploadFolder] = useState("");

  const [editingFile, setEditingFile] = useState<DocFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<DocFile | null>(null);

  const { user } = useAuthStore();

  /* ─── Fetch Documents from Firestore (no auto-seeding) ─── */
  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: DocFile[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name:     data.name     ?? "",
            type:     data.type     ?? "pdf",
            size:     data.size     ?? 0,
            uploader: data.uploader ?? "System",
            date:     data.date     ?? "",
            dept:     data.dept     ?? "All",
            tags:     data.tags     ?? [],
            pinned:   !!data.pinned,
            favorite: !!data.favorite,
            folderId: data.folderId ?? "",
          };
        });
        setFiles(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const folder = FOLDERS.find((f) => f.id === selectedFolder);

  /* ─── Filtering Logic ─── */
  const filtered = files.filter((f) => {
    // 1. Folder filter
    if (selectedFolder && f.folderId !== selectedFolder) return false;
    
    // 2. Special Pinned/Favorite filter
    if (specialFilter === "favorites" && !f.favorite) return false;
    if (specialFilter === "pinned" && !f.pinned) return false;

    // 3. Search query
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      f.uploader.toLowerCase().includes(search.toLowerCase());

    return matchSearch;
  });

  /* ─── CRUD Action Handlers ─── */
  const handleUploadSubmit = async () => {
    const name = uploadName.trim() || "New_Document.pdf";
    const tagsArr = uploadTags.split(",").map((t) => t.trim()).filter(Boolean);
    const ext = name.split(".").pop() || "pdf";

    const uploaderName = user?.email?.split("@")[0] || "HR Admin";

    try {
      await addDoc(collection(db, "documents"), {
        name: name.includes(".") ? name : `${name}.pdf`,
        type: ext,
        size: Math.floor(Math.random() * 500000) + 50000,
        uploader: uploaderName.charAt(0).toUpperCase() + uploaderName.slice(1),
        date: new Date().toISOString().split("T")[0],
        dept: "All",
        tags: tagsArr.length ? tagsArr : ["uploaded"],
        pinned: false,
        favorite: false,
        folderId: uploadFolder,
        createdAt: serverTimestamp(),
      });
      toast.success(`Document "${name}" uploaded successfully!`);
      setUploadName("");
      setUploadTags("");
      setUploadFolder("");
      setShowUpload(false);
    } catch {
      toast.error("Failed to upload document");
    }
  };

  const handleUpdate = async (id: string, updated: Partial<DocFile>) => {
    try {
      await updateDoc(doc(db, "documents", id), updated);
      if (preview && preview.id === id) {
        setPreview((p) => (p ? { ...p, ...updated } : null));
      }
    } catch (e) {
      console.error("Update failed", e);
      throw e;
    }
  };

  const toggleFavorite = async (file: DocFile) => {
    try {
      await updateDoc(doc(db, "documents", file.id), {
        favorite: !file.favorite,
      });
      toast.success(file.favorite ? "Removed from favorites!" : "Added to favorites!");
    } catch {
      toast.error("Failed to update favorite status");
    }
  };

  const togglePin = async (file: DocFile) => {
    try {
      await updateDoc(doc(db, "documents", file.id), {
        pinned: !file.pinned,
      });
      toast.success(file.pinned ? "Document unpinned!" : "Document pinned!");
    } catch {
      toast.error("Failed to update pinned status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "documents", id));
      toast.success("Document deleted successfully!");
      if (preview && preview.id === id) setPreview(null);
      setDeletingFile(null);
    } catch {
      toast.error("Failed to delete document");
    }
  };

  // Dynamic counts for sidebar
  const getFolderCount = (fId: string) => files.filter((f) => f.folderId === fId).length;

  return (
    <div className="page-container" style={{ display: "flex", gap: 0, padding: 0 }}>
      {/* Modals */}
      {editingFile && (
        <EditDocModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSave={handleUpdate}
        />
      )}

      {deletingFile && (
        <ConfirmDialog
          message={`Are you sure you want to permanently delete "${deletingFile.name}"?`}
          onConfirm={() => handleDelete(deletingFile.id)}
          onCancel={() => setDeletingFile(null)}
        />
      )}

      {/* Left: Folder Tree - Editorial style */}
      <div style={{ width: 260, minWidth: 260, borderRight: "1px solid var(--border)", padding: "32px 16px", overflowY: "auto", background: "var(--bg-secondary)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 10px", marginBottom: 16 }}>Archive System</div>
        
        <button
          onClick={() => { setSelectedFolder(null); setSpecialFilter("all"); }}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
            background: (!selectedFolder && specialFilter === "all") ? "var(--text-primary)" : "transparent",
            border: "none", cursor: "pointer",
            color: (!selectedFolder && specialFilter === "all") ? "var(--bg-primary)" : "var(--text-primary)",
            fontSize: 13, fontWeight: 600, transition: "all 0.15s"
          }}
        >
          <FolderOpen size={16} /> All Documents
        </button>
        
        {FOLDERS.map((f) => {
          const isSelected = selectedFolder === f.id;
          return (
            <button
              key={f.id}
              onClick={() => { setSelectedFolder(f.id); setSpecialFilter("all"); }}
              style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between", 
                width: "100%", padding: "10px 12px", 
                background: isSelected ? "var(--text-primary)" : "transparent", 
                border: "none", cursor: "pointer", 
                color: isSelected ? "var(--bg-primary)" : "var(--text-primary)", 
                fontSize: 13, transition: "background 0.15s",
                borderLeft: isSelected ? "none" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "rgba(9,9,9,0.04)";
                  e.currentTarget.style.borderLeft = "2px solid var(--brand-red)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderLeft = "2px solid transparent";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <span style={{ fontWeight: 500 }}>{f.name}</span>
              </div>
              <span style={{
                fontSize: 10,
                background: isSelected ? "rgba(255,255,255,0.2)" : "rgba(9,9,9,0.08)",
                padding: "2px 6px",
                color: isSelected ? "#fff" : "var(--text-muted)",
                fontFamily: "monospace"
              }}>
                {getFolderCount(f.id)}
              </span>
            </button>
          );
        })}
        
        <div style={{ height: 1, background: "var(--border)", margin: "24px 0" }} />
        
        <button
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
            background: specialFilter === "favorites" ? "var(--text-primary)" : "transparent",
            color: specialFilter === "favorites" ? "var(--bg-primary)" : "var(--text-primary)",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500
          }}
          onClick={() => { setSpecialFilter("favorites"); setSelectedFolder(null); }}
        >
          <Star size={16} /> Favorites
        </button>
        <button
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
            background: specialFilter === "pinned" ? "var(--text-primary)" : "transparent",
            color: specialFilter === "pinned" ? "var(--bg-primary)" : "var(--text-primary)",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500
          }}
          onClick={() => { setSpecialFilter("pinned"); setSelectedFolder(null); }}
        >
          <Pin size={16} /> Pinned
        </button>
      </div>

      {/* Right: Content */}
      <div style={{ flex: 1, padding: 48, overflowY: "auto", background: "var(--bg-primary)" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 32, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span style={{ cursor: "pointer", color: "var(--text-primary)" }} onClick={() => setSelectedFolder(null)}>Archive</span>
          {folder && <><ChevronRight size={12} /><span style={{ color: "var(--brand-red)" }}>{folder.name}</span></>}
          {specialFilter !== "all" && <><ChevronRight size={12} /><span style={{ color: "var(--brand-red)" }}>{specialFilter}</span></>}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input id="doc-search" className="input-base" placeholder="Search files, tags, custodian..." style={{ paddingLeft: 36, fontSize: 14 }} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 0, background: "transparent", border: "1px solid var(--border-strong)" }}>
            <button id="doc-view-grid" onClick={() => setView("grid")} className="btn" style={{ padding: "8px 12px", background: view === "grid" ? "var(--text-primary)" : "transparent", color: view === "grid" ? "var(--bg-primary)" : "var(--text-primary)", borderRadius: 0 }}><Grid3X3 size={14} /></button>
            <button id="doc-view-list" onClick={() => setView("list")} className="btn" style={{ padding: "8px 12px", background: view === "list" ? "var(--text-primary)" : "transparent", color: view === "list" ? "var(--bg-primary)" : "var(--text-primary)", borderRadius: 0 }}><List size={14} /></button>
          </div>
          <button id="doc-upload" onClick={() => setShowUpload(true)} className="btn btn-primary" style={{ gap: 8 }}>
            <Upload size={14} /> Upload File
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: 12, color: "var(--text-muted)" }}>
            <Loader2 size={20} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Syncing archive...</span>
          </div>
        ) : (
          <>
            {/* Pinned Documents */}
            {!selectedFolder && specialFilter === "all" && files.filter(f => f.pinned).length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>📌 Pinned Records</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {files.filter((f) => f.pinned).map((f) => (
                    <div key={f.id} className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderLeft: "4px solid var(--brand-red)" }} onClick={() => setPreview(f)}>
                      <div style={{ width: 40, height: 40, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                        {fileIcon(f.type)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginTop: 2 }}>{fileSizeLabel(f.size)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", border: "1px dashed var(--border-strong)", background: "var(--bg-secondary)" }}>
                <Info size={28} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>No archive records found</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Try updating your search query or upload a new document.</p>
              </div>
            ) : (
              <>
                {/* Files Grid - Brutalist cards */}
                {view === "grid" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                    {filtered.map((f) => (
                      <div key={f.id} className="card" style={{ padding: "20px", cursor: "pointer", transition: "border-color 0.1s", background: "var(--bg-secondary)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--text-primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                        onClick={() => setPreview(f)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                          <div style={{ width: 48, height: 48, background: "var(--bg-primary)", border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>{fileIcon(f.type)}</div>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                            {f.favorite && <Star size={14} color="var(--brand-red)" fill="var(--brand-red)" style={{ cursor: "pointer" }} onClick={() => toggleFavorite(f)} />}
                            <ActionMenu
                              file={f}
                              onPreview={() => setPreview(f)}
                              onEdit={() => setEditingFile(f)}
                              onDelete={() => setDeletingFile(f)}
                              onTogglePin={() => togglePin(f)}
                              onToggleFav={() => toggleFavorite(f)}
                            />
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4, letterSpacing: "-0.01em" }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, fontFamily: "monospace" }}>{fileSizeLabel(f.size)} · {formatDate(f.date)}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {f.tags.map((t) => (
                            <span key={t} style={{ fontSize: 10, padding: "2px 6px", border: "1px solid var(--border-strong)", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--bg-primary)" }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Files List - Editorial Table */}
                {view === "list" && (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-strong)" }}>Record Name</th>
                          <th style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-strong)" }}>Size</th>
                          <th style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-strong)" }}>Custodian</th>
                          <th style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-strong)" }}>Date</th>
                          <th style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-strong)" }}>Tags</th>
                          <th style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-strong)", textAlign: "right", paddingRight: 24 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((f) => (
                          <tr key={f.id} style={{ cursor: "pointer" }} onClick={() => setPreview(f)}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                {fileIcon(f.type)}
                                <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em" }}>{f.name}</span>
                                {f.pinned   && <Pin  size={12} color="var(--brand-red)" />}
                                {f.favorite && <Star size={12} color="var(--brand-red)" fill="var(--brand-red)" />}
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{fileSizeLabel(f.size)}</td>
                            <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{f.uploader}</td>
                            <td style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{formatDate(f.date)}</td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                {f.tags.map((t) => <span key={t} style={{ fontSize: 10, padding: "2px 6px", border: "1px solid var(--border-strong)", color: "var(--text-secondary)", textTransform: "uppercase" }}>{t}</span>)}
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right", paddingRight: 16 }}>
                              <ActionMenu
                                file={f}
                                onPreview={() => setPreview(f)}
                                onEdit={() => setEditingFile(f)}
                                onDelete={() => setDeletingFile(f)}
                                onTogglePin={() => togglePin(f)}
                                onToggleFav={() => toggleFavorite(f)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(9,9,9,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ padding: 40, width: 500, background: "var(--bg-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Upload Record</div>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setShowUpload(false)}><X size={18} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Record Name</label>
                <input id="doc-upload-name" className="input-base" placeholder="e.g. Q2_Policy" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
              </div>
              
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Category / Folder</label>
                <select className="input-base" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)}>
                  <option value="">No Folder (Root)</option>
                  {FOLDERS.map((f) => (
                    <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Tags</label>
                <input id="doc-upload-tags" className="input-base" placeholder="metadata, tags, comma separated" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button id="doc-upload-submit" className="btn btn-primary" style={{ flex: 1 }} onClick={handleUploadSubmit}>Upload to Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal - White paper style */}
      {preview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(9,9,9,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ padding: 0, width: 600, background: "#ffffff", borderRadius: 0, border: "none" }}>
            
            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-strong)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ padding: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>{fileIcon(preview.type)}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#000", letterSpacing: "-0.02em" }}>{preview.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace", marginTop: 4 }}>
                    ID: {preview.id} | {fileSizeLabel(preview.size)} | BY {preview.uploader.toUpperCase()}
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ padding: 8, color: "#000" }} onClick={() => setPreview(null)}><X size={20} /></button>
            </div>
            
            <div style={{ padding: "64px 32px", textAlign: "center", background: "#fafafa" }}>
              <FileText size={64} color="var(--border-strong)" style={{ margin: "0 auto 24px" }} strokeWidth={1} />
              <p style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "monospace", textTransform: "uppercase" }}>[ Content Preview Restricted ]<br/>Connect Storage Provider</p>
            </div>
            
            <div style={{ padding: "24px 32px", borderTop: "1px solid var(--border-strong)", display: "flex", gap: 12, background: "#fff" }}>
              <button id="doc-preview-download" className="btn btn-primary" style={{ flex: 1 }} onClick={() => { toast.success(`Record "${preview.name}" downloaded successfully.`); }}><Download size={14} /> Download File</button>
              <button className="btn btn-secondary" onClick={() => togglePin(preview)}><Pin size={14} /> {preview.pinned ? "Unpin" : "Pin"}</button>
              <button className="btn btn-secondary" onClick={() => toggleFavorite(preview)}><Star size={14} /> {preview.favorite ? "Unfavourite" : "Favourite"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
