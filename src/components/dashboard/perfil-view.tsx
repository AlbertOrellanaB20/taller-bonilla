"use client";

import { useState } from "react";
import { cambiarMiPassword } from "@/lib/domain/usuarios";
import { unwrap } from "@/lib/result";
import { PasswordStrength, passwordIsStrong } from "@/components/password-strength";

interface PerfilViewProps {
  name: string;
  email: string;
  username: string;
  role: string;
}

function initialsFor(name: string): string {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function PerfilView({ name, email, username, role }: PerfilViewProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSave = passwordIsStrong(password) && password === confirm;

  async function handleSave() {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      unwrap(await cambiarMiPassword(password));
      setSuccess(true);
      setPassword("");
      setConfirm("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar la contraseña. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = { background: "#252529", border: "1.5px solid #35353a", color: "#f0f0f2", borderRadius: 8, padding: "10px 14px", width: "100%", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" };
  const infoBox = (label: string, value: string) => (
    <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 12, padding: 16 }}>
      <div style={{ color: "#5a5a65", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 560 }}>
      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Mi perfil</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Tu información y acceso al sistema</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #A31212 0%, #7a0d0d 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
          {initialsFor(name)}
        </div>
        <div>
          <div style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 700 }}>{name}</div>
          <div style={{ color: "#8a8a96", fontSize: 13 }}>{role}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {infoBox("Correo", email)}
        {infoBox("Usuario", username)}
      </div>

      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
        {success && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: 14, gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ color: "#4ade80", fontSize: 14, fontWeight: 600 }}>Contraseña actualizada</div>
          </div>
        )}

        <div>
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700, margin: 0 }}>Cambiar contraseña</h2>
          <p style={{ color: "#5a5a65", fontSize: 12, margin: "2px 0 0" }}>La próxima vez que inicies sesión, usa la nueva contraseña.</p>
        </div>

        <div>
          <label style={labelStyle}>Nueva contraseña</label>
          <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <PasswordStrength password={password} />
        </div>

        <div>
          <label style={labelStyle}>Confirmar contraseña</label>
          <input type="password" style={{ ...inputStyle, borderColor: mismatch ? "#ef4444" : inputStyle.borderColor }} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          {mismatch && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>Las contraseñas no coinciden.</p>}
        </div>

        {error && (
          <div style={{ background: "rgba(163,18,18,0.12)", border: "1px solid rgba(163,18,18,0.35)", borderRadius: 8, padding: "10px 14px", color: "#e87070", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button onClick={handleSave} disabled={!canSave || saving}
          style={{ alignSelf: "flex-start", background: canSave ? "#A31212" : "#35353a", border: "none", borderRadius: 8, padding: "10px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed", opacity: canSave ? 1 : 0.45, transition: "all .2s" }}>
          {saving ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </div>
    </div>
  );
}
