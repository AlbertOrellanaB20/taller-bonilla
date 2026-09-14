"use client";

import { useState, useEffect, useRef } from "react";
import {
  type User,
  type Role,
  type UserFormInput,
  crearUsuario,
  actualizarUsuario,
  toggleActivoUsuario,
} from "@/lib/domain/usuarios";

interface FormState {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: Role;
  specialty: string;
  active: boolean;
}

const BLANK_FORM: FormState = {
  name: "", email: "", username: "", password: "", confirmPassword: "",
  role: "Mecánico", specialty: "", active: true,
};

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<Role, { bg: string; color: string }> = {
  Administrador: { bg: "rgba(163,18,18,0.15)", color: "#f87171" },
  Supervisora: { bg: "rgba(249,115,22,0.15)", color: "#fb923c" },
  "Secretario/a": { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  Mecánico: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  Inventario: { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
};

function RoleBadge({ role }: { role: Role }) {
  const s = ROLE_STYLE[role];
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
      {role}
    </span>
  );
}

// ── Initials avatar ───────────────────────────────────────────────────────────

function Avatar({ name, role }: { name: string; role: Role }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const s = ROLE_STYLE[role];
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: s.bg, border: `1.5px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{initials}</span>
    </div>
  );
}

// ── Password strength ──────────────────────────────────────────────────────────

function checkPassword(pw: string) {
  return {
    len: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    num: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function strengthLevel(checks: ReturnType<typeof checkPassword>) {
  return Object.values(checks).filter(Boolean).length;
}

const STRENGTH_COLORS = ["#ef4444", "#f59e0b", "#f59e0b", "#22c55e", "#22c55e"];
const STRENGTH_LABELS = ["", "Débil", "Regular", "Buena", "Fuerte"];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = checkPassword(password);
  const level = strengthLevel(checks);
  const color = STRENGTH_COLORS[level];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 3, background: i <= level ? color : "#35353a", transition: "background 0.3s" }} />
        ))}
      </div>
      {level > 0 && <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 8 }}>{STRENGTH_LABELS[level]}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { key: "len", label: "Mínimo 8 caracteres" },
          { key: "upper", label: "Al menos una mayúscula" },
          { key: "num", label: "Al menos un número" },
          { key: "special", label: "Al menos un carácter especial" },
        ].map((r) => {
          const ok = checks[r.key as keyof typeof checks];
          return (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: ok ? "#4ade80" : "#5a5a65", transition: "color 0.2s" }}>{ok ? "✓" : "○"}</span>
              <span style={{ fontSize: 12, color: ok ? "#a0a0a8" : "#5a5a65", transition: "color 0.2s" }}>{r.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastData { id: number; message: string; type: "success" | "error" | "info" }

function Toast({ toast, onDone }: { toast: ToastData; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 5700);
    const t2 = setTimeout(onDone, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const bgColor = toast.type === "success" ? "#16a34a" : toast.type === "error" ? "#A31212" : "#2563eb";

  return (
    <div
      className={exiting ? "toast-exit" : "toast-enter"}
      style={{ background: bgColor, color: "#fff", padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: 340, display: "flex", alignItems: "center", gap: 10 }}
    >
      {toast.type === "success" && <span style={{ fontSize: 16 }}>✓</span>}
      {toast.type === "error" && <span style={{ fontSize: 16 }}>✕</span>}
      {toast.message}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  editing: User | null;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
}

function UserModal({ editing, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState<FormState>(
    editing
      ? { name: editing.name, email: editing.email, username: editing.username, password: "", confirmPassword: "", role: editing.role, specialty: editing.specialty ?? "", active: editing.active }
      : BLANK_FORM
  );
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function set(k: keyof FormState, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => { const ne = { ...e }; delete ne[k]; return ne; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!form.email.includes("@")) e.email = "Correo inválido";
    if (!form.username.trim()) e.username = "Requerido";
    if (!editing || form.password) {
      const c = checkPassword(form.password);
      if (!Object.values(c).every(Boolean)) e.password = "La contraseña no cumple los requisitos";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Las contraseñas no coinciden";
    }
    if (form.role === "Mecánico" && !form.specialty.trim()) e.specialty = "Requerido para mecánicos";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaveError(null);
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  const pwMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const inputStyle = (hasErr?: boolean): React.CSSProperties => ({
    background: "#252529", border: `1.5px solid ${hasErr ? "#ef4444" : "#35353a"}`, color: "#f0f0f2",
    borderRadius: 8, padding: "10px 14px", width: "100%", fontSize: 14,
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: 520, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: "linear-gradient(90deg, #A31212, #7a0d0d)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>{editing ? "Editar usuario" : "Nuevo usuario"}</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>
              {editing ? `Editando: ${editing.username}` : "Completa los datos del nuevo empleado"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nombre completo *</label>
            <input className="db-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: María González" style={inputStyle(!!errors.name)} />
            {errors.name && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.name}</p>}
          </div>

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Correo electrónico *</label>
            <input className="db-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="usuario@tallerbonilla.sv" style={inputStyle(!!errors.email)} />
            {errors.email && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.email}</p>}
          </div>

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nombre de usuario *</label>
            <input className="db-input" value={form.username} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="ej: mgonzalez" style={inputStyle(!!errors.username)} />
            {errors.username && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.username}</p>}
          </div>

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="db-input"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle(!!errors.password), paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5a5a65", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPw ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>}
                </svg>
              </button>
            </div>
            {form.password && <PasswordStrength password={form.password} />}
            {errors.password && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.password}</p>}
          </div>

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Confirmar contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                className="db-input"
                type={showCpw ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle(!!errors.confirmPassword), paddingRight: 42, borderColor: pwMatch ? "#22c55e" : pwMismatch ? "#ef4444" : undefined }}
              />
              <button type="button" onClick={() => setShowCpw((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5a5a65", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showCpw ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>}
                </svg>
              </button>
              {pwMatch && <span style={{ position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)", color: "#22c55e", fontSize: 14 }}>✓</span>}
              {pwMismatch && <span style={{ position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)", color: "#ef4444", fontSize: 14 }}>✕</span>}
            </div>
            {pwMatch && <p style={{ color: "#4ade80", fontSize: 11, marginTop: 4 }}>Las contraseñas coinciden</p>}
            {errors.confirmPassword && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.confirmPassword}</p>}
          </div>

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rol *</label>
            <div style={{ position: "relative" }}>
              <select className="db-select" value={form.role} onChange={(e) => set("role", e.target.value)} style={{ ...inputStyle(), width: "100%", cursor: "pointer" }}>
                <option value="Administrador">Administrador</option>
                <option value="Supervisora">Supervisora</option>
                <option value="Secretario/a">Secretario/a</option>
                <option value="Mecánico">Mecánico</option>
                <option value="Inventario">Inventario</option>
              </select>
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#5a5a65", pointerEvents: "none" }}>▾</span>
            </div>
          </div>

          {form.role === "Mecánico" && (
            <div>
              <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Especialidad *</label>
              <input className="db-input" value={form.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="Ej: Motor y transmisión" style={inputStyle(!!errors.specialty)} />
              {errors.specialty && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.specialty}</p>}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#252529", borderRadius: 8, padding: "12px 14px" }}>
            <div>
              <div style={{ color: "#c0c0c8", fontSize: 13, fontWeight: 500 }}>Estado del usuario</div>
              <div style={{ color: "#5a5a65", fontSize: 11 }}>{form.active ? "Usuario activo — puede iniciar sesión" : "Usuario inactivo — sin acceso"}</div>
            </div>
            <button
              type="button"
              onClick={() => set("active", !form.active)}
              style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: form.active ? "#A31212" : "#35353a", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
            >
              <div style={{ position: "absolute", top: 2, left: form.active ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
            </button>
          </div>

          {saveError && (
            <div style={{ background: "rgba(163,18,18,0.12)", border: "1px solid rgba(163,18,18,0.35)", borderRadius: 8, padding: "10px 14px", color: "#e87070", fontSize: 13 }}>
              {saveError}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2a2e", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 20px", color: "#8a8a96", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6a6a76")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#35353a")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: "#A31212", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#c01515"; e.currentTarget.style.boxShadow = "0 0 16px rgba(163,18,18,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#A31212"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── UsersView ─────────────────────────────────────────────────────────────────

export default function UsersView({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [modal, setModal] = useState<"new" | User | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextToastId = useRef(0);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = nextToastId.current++;
    setToasts((t) => [...t, { id, message, type }]);
  }

  function removeToast(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  async function handleSave(form: FormState) {
    const editing = typeof modal === "object" && modal !== null ? modal : null;
    const input: UserFormInput = {
      name: form.name,
      email: form.email,
      username: form.username,
      password: form.password,
      role: form.role,
      specialty: form.specialty,
      active: form.active,
    };

    if (editing) {
      const updated = await actualizarUsuario(editing.id, editing.authUserId, input);
      setUsers((u) => u.map((user) => (user.id === updated.id ? updated : user)));
      addToast(`Usuario "${updated.username}" actualizado correctamente.`);
    } else {
      const created = await crearUsuario(input);
      setUsers((u) => [...u, created]);
      addToast(`Usuario "${created.username}" creado exitosamente.`);
    }
    setModal(null);
  }

  async function toggleActive(user: User) {
    const next = !user.active;
    setUsers((u) => u.map((x) => (x.id === user.id ? { ...x, active: next } : x)));
    try {
      await toggleActivoUsuario(user.id, next);
      addToast(`Usuario "${user.username}" ${next ? "activado" : "desactivado"}.`, next ? "success" : "info");
    } catch (e) {
      setUsers((u) => u.map((x) => (x.id === user.id ? { ...x, active: !next } : x)));
      addToast(e instanceof Error ? e.message : "No se pudo cambiar el estado del usuario.", "error");
    }
  }

  function resetPassword(user: User) {
    // Abre el mismo formulario de edición: el Admin escribe la contraseña
    // nueva ahí (con el medidor de fortaleza) en vez de recibir una al azar.
    setModal(user);
  }

  return (
    <div>
      <style>{`
        .users-table { width: 100%; border-collapse: collapse; }
        .users-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .users-table td { padding: 12px 14px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tbody tr { transition: background 0.15s; }
        .users-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .action-btn { background: rgba(255,255,255,0.04); border: 1px solid #2a2a2e; border-radius: 6px; padding: 5px 10px; color: #8a8a96; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .action-btn:hover { background: rgba(163,18,18,0.12); border-color: rgba(163,18,18,0.3); color: #f87171; }
        .action-btn.deactivate:hover { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: #fbbf24; }
        .action-btn.activate:hover { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); color: #4ade80; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Usuarios del sistema</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{users.filter((u) => u.active).length} activos · {users.length} total</p>
        </div>
        <button
          onClick={() => setModal("new")}
          style={{ background: "#A31212", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#c01515"; e.currentTarget.style.boxShadow = "0 0 16px rgba(163,18,18,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#A31212"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo Usuario
        </button>
      </div>

      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={user.name} role={user.role} />
                      <div>
                        <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                        <div style={{ color: "#5a5a65", fontSize: 11, marginTop: 1 }}>@{user.username}</div>
                        {user.specialty && <div style={{ color: "#6a6a76", fontSize: 10, marginTop: 1 }}>🔧 {user.specialty}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "#8a8a96" }}>{user.email}</td>
                  <td><RoleBadge role={user.role} /></td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: user.active ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
                      <span style={{ color: user.active ? "#4ade80" : "#f87171", fontSize: 12, fontWeight: 500 }}>{user.active ? "Activo" : "Inactivo"}</span>
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                      <button className="action-btn" onClick={() => setModal(user)}>Editar</button>
                      <button className={`action-btn ${user.active ? "deactivate" : "activate"}`} onClick={() => toggleActive(user)}>
                        {user.active ? "Desactivar" : "Activar"}
                      </button>
                      <button className="action-btn" onClick={() => resetPassword(user)}>Cambiar contraseña</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <UserModal editing={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 300, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
}
