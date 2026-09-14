import ReportesView from "./reportes-view";
import { getSupervisoraReportes } from "@/lib/domain/reportes";

export default async function SupervisoraReportesPage() {
  const data = await getSupervisoraReportes();
  return <ReportesView data={data} />;
}
