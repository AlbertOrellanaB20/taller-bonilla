"use client";

import { useEffect } from "react";

// Se activa solo si el layout raíz (src/app/layout.tsx) también falla, así
// que reemplaza <html> y <body> por completo — no puede depender de nada
// más del árbol de la app, por eso todo va en estilos en línea aquí mismo.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Error global de la aplicación:", error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0D0D0F", fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 440, background: "#212125", borderRadius: 16, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", textAlign: "center" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, #A31212 0%, #7a0d0d 100%)" }} />
          <div style={{ padding: "36px 32px" }}>
            <h1 style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 700, margin: 0 }}>Taller Bonilla no pudo cargar</h1>
            <p style={{ color: "#8a8a96", fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>
              Ocurrió un error inesperado. Intenta de nuevo en unos segundos.
            </p>
            <button
              onClick={() => reset()}
              style={{ marginTop: 24, width: "100%", background: "#A31212", border: "none", borderRadius: 9, padding: "10px 16px", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
