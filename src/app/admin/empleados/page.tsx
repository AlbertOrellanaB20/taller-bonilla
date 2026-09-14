import EmpleadosView from "@/app/supervisora/empleados/empleados-view";
import { listEmpleados } from "@/lib/domain/empleados";

export default async function AdminEmpleadosPage() {
  const employees = await listEmpleados();
  return <EmpleadosView employees={employees} />;
}
