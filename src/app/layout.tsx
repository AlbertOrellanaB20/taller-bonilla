import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taller Bonilla — Sistema de Gestión",
  description:
    "Sistema de gestión para El Taller Bonilla: clientes, vehículos, órdenes de servicio, inventario y facturación.",
};

export const viewport: Viewport = {
  themeColor: "#0D0D0F",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
