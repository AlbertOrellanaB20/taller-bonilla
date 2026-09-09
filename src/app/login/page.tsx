import type { Metadata } from "next";
import LoginScreen from "./login-screen";

export const metadata: Metadata = {
  title: "Iniciar sesión — Taller Bonilla",
};

export default function LoginPage() {
  return <LoginScreen />;
}
