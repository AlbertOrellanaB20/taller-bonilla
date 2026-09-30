import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { PerfilView } from "@/components/dashboard/perfil-view";

export default async function PerfilPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  return <PerfilView name={usuario.nombreCompleto} email={usuario.correo} username={usuario.nombreUsuario} role={usuario.rol} />;
}
