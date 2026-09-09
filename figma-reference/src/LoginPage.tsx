import { useState, useEffect } from "react";
import logoImg from "@/imports/Logo.png";

function GearIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M32 20a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" fill="currentColor" />
      <path d="M54.1 28.6l-3.2-.7a19.3 19.3 0 0 0-1.5-3.6l1.8-2.7a2 2 0 0 0-.3-2.5l-5.9-5.9a2 2 0 0 0-2.5-.3l-2.7 1.8a19.3 19.3 0 0 0-3.6-1.5l-.7-3.2A2 2 0 0 0 33.5 8h-3a2 2 0 0 0-2 1.6l-.7 3.2a19.3 19.3 0 0 0-3.6 1.5l-2.7-1.8a2 2 0 0 0-2.5.3L13 18.7a2 2 0 0 0-.3 2.5l1.8 2.7a19.3 19.3 0 0 0-1.5 3.6l-3.2.7A2 2 0 0 0 8 30.2v3a2 2 0 0 0 1.6 2l3.2.7a19.3 19.3 0 0 0 1.5 3.6l-1.8 2.7a2 2 0 0 0 .3 2.5l5.9 5.9a2 2 0 0 0 2.5.3l2.7-1.8a19.3 19.3 0 0 0 3.6 1.5l.7 3.2a2 2 0 0 0 2 1.6h3a2 2 0 0 0 2-1.6l.7-3.2a19.3 19.3 0 0 0 3.6-1.5l2.7 1.8a2 2 0 0 0 2.5-.3l5.9-5.9a2 2 0 0 0 .3-2.5l-1.8-2.7a19.3 19.3 0 0 0 1.5-3.6l3.2-.7A2 2 0 0 0 56 35v-3a2 2 0 0 0-1.9-1.4z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function WrenchIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M46.3 9.7a13 13 0 0 0-14.5 2L27 16.5l-3.5-3.5-4.9 4.9 3.5 3.5-12 12a7 7 0 1 0 9.9 9.9l12-12 3.5 3.5 4.9-4.9-3.5-3.5 4.8-4.8a13 13 0 0 0 2-14.5l-5.6 5.6a4 4 0 0 1-5.7-5.7l5.9-5.8zM14 44a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor" />
    </svg>
  );
}

function NutIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 4l17.3 10v20L24 44 6.7 34V14L24 4z" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

function PistonIcon({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect x="14" y="6" width="32" height="22" rx="4" fill="currentColor" opacity="0.7" />
      <rect x="20" y="28" width="20" height="8" rx="2" fill="currentColor" />
      <rect x="25" y="36" width="10" height="18" rx="3" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function TireIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="36" cy="36" r="18" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="36" cy="36" r="8" fill="currentColor" opacity="0.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const r1 = 20, r2 = 28;
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={i}
            x1={36 + r1 * Math.cos(rad)} y1={36 + r1 * Math.sin(rad)}
            x2={36 + r2 * Math.cos(rad)} y2={36 + r2 * Math.sin(rad)}
            stroke="currentColor" strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

function BoltIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <path d="M26 4L10 26h14l-6 14 20-22H24L30 4z" fill="currentColor" />
    </svg>
  );
}

function BrandingPanel() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden" style={{ background: "#0D0D0F", minHeight: "100%" }}>
      <div className="pulse-glow-anim absolute brand-glow" style={{ width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(163,18,18,0.55) 0%, rgba(163,18,18,0.15) 55%, transparent 80%)", filter: "blur(32px)", zIndex: 1 }} />

      <div className="brand-float absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="float-1 absolute" style={{ top: "8%", left: "6%", color: "rgba(163,18,18,0.28)" }}><div className="gear-spin"><GearIcon size={70} /></div></div>
        <div className="float-2 absolute" style={{ top: "12%", right: "8%", color: "rgba(163,18,18,0.22)" }}><WrenchIcon size={60} /></div>
        <div className="float-3 absolute" style={{ top: "38%", left: "4%", color: "rgba(163,18,18,0.30)" }}><NutIcon size={52} /></div>
        <div className="float-4 absolute" style={{ bottom: "14%", right: "5%", color: "rgba(163,18,18,0.25)" }}><div className="gear-spin-rev"><GearIcon size={80} /></div></div>
        <div className="float-5 absolute" style={{ bottom: "10%", left: "8%", color: "rgba(163,18,18,0.20)" }}><PistonIcon size={65} /></div>
        <div className="float-6 absolute" style={{ top: "5%", right: "28%", color: "rgba(163,18,18,0.16)" }}><TireIcon size={78} /></div>
        <div className="float-7 absolute" style={{ top: "55%", right: "10%", color: "rgba(163,18,18,0.24)" }}><BoltIcon size={48} /></div>
        <div className="float-8 absolute" style={{ bottom: "5%", left: "38%", color: "rgba(163,18,18,0.18)" }}><div className="gear-spin"><GearIcon size={42} /></div></div>
      </div>

      <div className="logo-card relative flex flex-col items-center justify-center" style={{ zIndex: 2, width: 264, height: 264, background: "#ffffff", borderRadius: 20, boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 2px 16px rgba(0,0,0,0.4)", padding: "24px 20px" }}>
        <img src={logoImg} alt="Taller Bonilla logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      <div className="brand-tagline relative mt-8 text-center" style={{ zIndex: 2 }}>
        <p style={{ color: "#8a8a96", fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 400 }}>Sistema de Gestión</p>
        <p style={{ color: "#3a3a42", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 400, marginTop: 4 }}>Taller Automotriz</p>
      </div>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

interface LoginPageProps {
  onLogin: (username: string) => void;
}

function LoginForm({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(username.trim());
    }, 1200);
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div className="animate-in-1">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: "#A31212", borderRadius: 2 }} />
          <h1 style={{ color: "#f0f0f2", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Iniciar sesión</h1>
        </div>
        <p style={{ color: "#5a5a65", fontSize: 13, marginBottom: 32, marginLeft: 13 }}>Ingresa tus credenciales para continuar</p>
      </div>

      <div className="animate-in-2" style={{ marginBottom: 18 }}>
        <label style={{ display: "block", color: "#8a8a96", fontSize: 12, fontWeight: 500, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Usuario</label>
        <input className="input-field" type="text" placeholder="ej: aorellana" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      </div>

      <div className="animate-in-3" style={{ marginBottom: 18 }}>
        <label style={{ display: "block", color: "#8a8a96", fontSize: 12, fontWeight: 500, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Contraseña</label>
        <div style={{ position: "relative" }}>
          <input className="input-field" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPassword((v) => !v)}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#5a5a65", display: "flex", alignItems: "center", padding: 0, transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#A31212")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5a5a65")}>
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>

      <div className="animate-in-4" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
        <a href="#" onClick={(e) => e.preventDefault()}
          style={{ color: "#A31212", fontSize: 13, textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#c01515")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#A31212")}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {error && (
        <div style={{ background: "rgba(163,18,18,0.12)", border: "1px solid rgba(163,18,18,0.35)", borderRadius: 8, padding: "10px 14px", marginBottom: 18, color: "#e87070", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="animate-in-5">
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span className="spinner" />
              Verificando...
            </span>
          ) : "Iniciar sesión"}
        </button>
      </div>

      <div className="animate-in-6" style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ color: "#3a3a42", fontSize: 12 }}>Sistema exclusivo para personal autorizado de Taller Bonilla</p>
      </div>
    </form>
  );
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{ width: "100%", minHeight: "100%", display: "flex", flexDirection: "row", fontFamily: "'Inter', sans-serif" }} className="login-root">
      <style>{`
        @media (max-width: 768px) {
          .login-root { flex-direction: column !important; }
          .brand-panel { min-height: 0 !important; height: 220px !important; flex: none !important; }
          .form-panel { flex: 1 !important; min-height: 0 !important; padding: 24px 16px !important; align-items: flex-start !important; }
          .brand-float { display: none !important; }
          .brand-glow { width: 200px !important; height: 200px !important; }
          .logo-card { width: 130px !important; height: 130px !important; border-radius: 14px !important; }
          .brand-tagline { margin-top: 12px !important; }
          .form-card { padding: 28px 22px !important; }
          .input-field { padding: 15px 16px !important; font-size: 16px !important; }
          .btn-primary { padding: 16px 24px !important; font-size: 16px !important; }
        }
      `}</style>

      <div className="brand-panel" style={{ flex: 1, minHeight: "100vh" }}>
        <BrandingPanel />
      </div>

      <div className="form-panel" style={{ flex: 1, minHeight: "100vh", background: "#1C1C1F", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div className="form-card" style={{ width: "100%", maxWidth: 420, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)", padding: "40px 36px", opacity: mounted ? 1 : 0, transition: "opacity 0.3s ease" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, #A31212 0%, #7a0d0d 100%)", borderRadius: "2px 2px 0 0", margin: "-40px -36px 36px -36px" }} />
          <LoginForm onLogin={onLogin} />
        </div>
      </div>
    </div>
  );
}
