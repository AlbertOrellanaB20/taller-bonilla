import UsersView from "./users-view";
import { listUsuarios } from "@/lib/domain/usuarios";

export default async function UsuariosPage() {
  const users = await listUsuarios();
  return <UsersView initialUsers={users} />;
}
