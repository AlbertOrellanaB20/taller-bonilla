import EmpleadosView from "./empleados-view";
import { listEmpleados } from "@/lib/domain/empleados";

export default async function SupervisoraEmpleadosPage() {
  const employees = await listEmpleados();
  return <EmpleadosView employees={employees} />;
}
