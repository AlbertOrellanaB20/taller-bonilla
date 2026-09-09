import { MECHANICS } from "./SupervisoraHome";

// ── Static employee data (read-only, no admin) ─────────────────────────────

type Role = "Supervisora" | "Secretario/a" | "Mecánico" | "Inventario";

interface Employee {
  name: string;
  role: Role;
  email: string;
  active: boolean;
  activeOrders?: number;
  specialty?: string;
}

const EMPLOYEES: Employee[] = [
  { name: "Nahomy Guzmán",   role: "Supervisora", email: "nguzman@tallerbonilla.cl",    active: true },
  { name: "Emely Rodríguez", role: "Secretario/a", email: "erodriguez@tallerbonilla.cl", active: true },
  { name: "Noé Arias",       role: "Mecánico",    email: "narias@tallerbonilla.cl",     active: true, activeOrders: 3, specialty: "Motor y frenos" },
  { name: "Pedro Salazar",   role: "Mecánico",    email: "psalazar@tallerbonilla.cl",   active: true, activeOrders: 2, specialty: "Suspensión y alineación" },
  { name: "José Ramírez",    role: "Mecánico",    email: "jramirez@tallerbonilla.cl",   active: true, activeOrders: 2, specialty: "Electricidad automotriz" },
  { name: "José Luis Rodas", role: "Inventario",  email: "jrodas@tallerbonilla.cl",     active: true },
];

const ROLE_STYLE: Record<Role, { bg: string; color: string }> = {
  "Supervisora": { bg: "rgba(249,115,22,0.15)",  color: "#fb923c" },
  "Secretario/a": { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
  "Mecánico":    { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  "Inventario":  { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa" },
};

function RoleBadge({ role }: { role: Role }) {
  const s = ROLE_STYLE[role];
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>{role}</span>;
}

function Avatar({ name, role }: { name: string; role: Role }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const s = ROLE_STYLE[role];
  return (
    <div style={{ width: 42, height: 42, borderRadius: "50%", background: s.bg, border: `1.5px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ color: s.color, fontSize: 14, fontWeight: 700 }}>{initials}</span>
    </div>
  );
}

export default function SupervisoraEmpleados() {
  const mechanics = EMPLOYEES.filter((e) => e.role === "Mecánico");
  const others    = EMPLOYEES.filter((e) => e.role !== "Mecánico");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .emp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .emp-other-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 900px) { .emp-grid { grid-template-columns: repeat(2,1fr); } .emp-other-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 520px) { .emp-grid { grid-template-columns: 1fr; } .emp-other-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Empleados</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Vista de solo lectura · {EMPLOYEES.filter((e) => e.active).length} activos</p>
      </div>

      {/* Readonly notice */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "10px 14px" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span style={{ color: "#60a5fa", fontSize: 13 }}>Vista de consulta. La gestión de cuentas la realiza el Administrador.</span>
      </div>

      {/* Mechanics section */}
      <div>
        <h2 style={{ color: "#8a8a96", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>Mecánicos</h2>
        <div className="emp-grid">
          {mechanics.map((emp) => (
            <div key={emp.name}
              style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, transition: "box-shadow 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(163,18,18,0.12)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={emp.name} role={emp.role} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.name}</div>
                  <div style={{ color: "#5a5a65", fontSize: 11, marginTop: 2 }}>{emp.email}</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <RoleBadge role={emp.role} />
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: emp.active ? "#22c55e" : "#ef4444" }} />
                    <span style={{ color: emp.active ? "#4ade80" : "#f87171", fontSize: 11, fontWeight: 500 }}>{emp.active ? "Activo" : "Inactivo"}</span>
                  </span>
                </div>
                {emp.specialty && (
                  <div style={{ color: "#6a6a76", fontSize: 11 }}>🔧 {emp.specialty}</div>
                )}
              </div>

              {/* Active orders meter */}
              {emp.activeOrders !== undefined && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ color: "#8a8a96", fontSize: 11 }}>Órdenes activas</span>
                    <span style={{ color: (emp.activeOrders ?? 0) > 3 ? "#f87171" : "#4ade80", fontSize: 11, fontWeight: 600 }}>{emp.activeOrders}</span>
                  </div>
                  <div style={{ height: 4, background: "#252529", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${Math.min(((emp.activeOrders ?? 0) / 5) * 100, 100)}%`, background: (emp.activeOrders ?? 0) > 3 ? "#ef4444" : "#A31212", borderRadius: 3, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Others section */}
      <div>
        <h2 style={{ color: "#8a8a96", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>Otro personal</h2>
        <div className="emp-other-grid">
          {others.map((emp) => (
            <div key={emp.name}
              style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, transition: "box-shadow 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(163,18,18,0.1)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
              <Avatar name={emp.name} role={emp.role} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{emp.name}</div>
                <div style={{ color: "#5a5a65", fontSize: 11, marginBottom: 6 }}>{emp.email}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <RoleBadge role={emp.role} />
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: emp.active ? "#22c55e" : "#ef4444" }} />
                    <span style={{ color: emp.active ? "#4ade80" : "#f87171", fontSize: 10, fontWeight: 500 }}>{emp.active ? "Activo" : "Inactivo"}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
