import DashboardHome from "./dashboard-home";
import { listRepuestosMasUsadosMes } from "@/lib/domain/inventario";

export default async function InventarioPage() {
  const topUsedParts = await listRepuestosMasUsadosMes();
  return <DashboardHome topUsedParts={topUsedParts} />;
}
