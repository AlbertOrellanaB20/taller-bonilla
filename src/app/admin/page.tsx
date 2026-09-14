import DashboardHome from "./dashboard-home";
import { getAdminDashboardStats } from "@/lib/domain/reportes";

export default async function AdminPage() {
  const stats = await getAdminDashboardStats();
  return <DashboardHome stats={stats} />;
}
