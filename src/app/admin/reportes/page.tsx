import ReportesView from "@/app/supervisora/reportes/reportes-view";
import { getSupervisoraReportes } from "@/lib/domain/reportes";

export default async function AdminReportesPage() {
  const data = await getSupervisoraReportes();
  return <ReportesView data={data} />;
}
