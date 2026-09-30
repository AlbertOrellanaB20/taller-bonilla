"use client";

export function checkPassword(pw: string) {
  return {
    len: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    num: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function strengthLevel(checks: ReturnType<typeof checkPassword>) {
  return Object.values(checks).filter(Boolean).length;
}

export function passwordIsStrong(pw: string): boolean {
  return Object.values(checkPassword(pw)).every(Boolean);
}

const STRENGTH_COLORS = ["#ef4444", "#f59e0b", "#f59e0b", "#22c55e", "#22c55e"];
const STRENGTH_LABELS = ["", "Débil", "Regular", "Buena", "Fuerte"];

export function PasswordStrength({ password }: { password: string }) {
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
