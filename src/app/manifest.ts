import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taller Bonilla — Sistema de Gestión",
    short_name: "Taller Bonilla",
    description:
      "Sistema de gestión para El Taller Bonilla: clientes, vehículos, órdenes de servicio, inventario y facturación.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0D0D0F",
    theme_color: "#0D0D0F",
    lang: "es-SV",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
