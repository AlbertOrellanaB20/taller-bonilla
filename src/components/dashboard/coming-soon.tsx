export function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, opacity: 0.6 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(163,18,18,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A31212" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
      </div>
      <h2 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 600 }}>{label}</h2>
      <p style={{ color: "#5a5a65", fontSize: 14 }}>Este módulo estará disponible próximamente.</p>
    </div>
  );
}
