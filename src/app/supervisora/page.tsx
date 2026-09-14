import SupervisoraHome from "./supervisora-home";
import { listOrdenesSupervisora } from "@/lib/domain/ordenes";
import { listMecanicosActivos } from "@/lib/domain/empleados";

export default async function SupervisoraPage() {
  const [orders, mechanics] = await Promise.all([listOrdenesSupervisora(), listMecanicosActivos()]);
  return <SupervisoraHome initialOrders={orders} mechanics={mechanics} />;
}
