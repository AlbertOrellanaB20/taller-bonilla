import type { Metadata } from "next";
import LoginScreen from "./login-screen";
import { getUsuarioActual } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión — Taller Bonilla",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const [usuario, params] = await Promise.all([getUsuarioActual(), searchParams]);

  return (
    <LoginScreen
      activeSession={usuario ? { nombreCompleto: usuario.nombreCompleto, rol: usuario.rol } : null}
      aviso={params.aviso}
    />
  );
}
