import { useState } from "react";
import LoginPage from "./LoginPage";
import DashboardPage from "./DashboardPage";
import SupervisoraDashboard from "./SupervisoraDashboard";
import CajeroDashboard from "./CajeroDashboard";
import MechanicDashboard from "./MechanicDashboard";
import InventoryDashboard from "./InventoryDashboard";

export type Session = { username: string };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  if (!session) {
    return <LoginPage onLogin={(username) => setSession({ username })} />;
  }

  if (session.username === "nguzman") {
    return <SupervisoraDashboard session={session} onLogout={() => setSession(null)} />;
  }

  if (session.username === "erodriguez") {
    return <CajeroDashboard session={session} onLogout={() => setSession(null)} />;
  }

  if (session.username === "jrodas") {
    return <InventoryDashboard session={session} onLogout={() => setSession(null)} />;
  }

  if (session.username === "narias") {
    return <MechanicDashboard session={session} onLogout={() => setSession(null)} />;
  }

  return <DashboardPage session={session} onLogout={() => setSession(null)} />;
}
