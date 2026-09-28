"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Error de la aplicación:", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0D0D0F", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#212125", borderRadius: 16, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", textAlign: "center" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #A31212 0%, #7a0d0d 100%)" }} />
        <div style={{ padding: "36px 32px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(163,18,18,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 700, margin: 0 }}>Algo salió mal</h1>
          <p style={{ color: "#8a8a96", fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>
            No pudimos completar esta acción. Puede ser algo momentáneo — intenta de nuevo en unos segundos.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <Link
              href="/login"
              style={{ flex: 1, textAlign: "center", background: "transparent", border: "1px solid #35353a", borderRadius: 9, padding: "10px 16px", color: "#c0c0c8", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
            >
              Ir al inicio
            </Link>
            <button
              onClick={() => reset()}
              style={{ flex: 1, background: "#A31212", border: "none", borderRadius: 9, padding: "10px 16px", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
