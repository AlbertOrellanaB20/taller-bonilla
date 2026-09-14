import SupervisoraHome from "@/app/supervisora/supervisora-home";
import { listOrdenesSupervisora } from "@/lib/domain/ordenes";
import { listMecanicosActivos } from "@/lib/domain/empleados";

export default async function AdminOrdenesPage() {
  const [orders, mechanics] = await Promise.all([listOrdenesSupervisora(), listMecanicosActivos()]);
  return <SupervisoraHome initialOrders={orders} mechanics={mechanics} />;
}
