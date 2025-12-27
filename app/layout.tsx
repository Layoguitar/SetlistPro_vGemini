import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. CONFIGURACIÓN VISUAL MÓVIL (VIEWPORT)
// Esto hace que se sienta como una app real:
// - themeColor: Pinta la barra del navegador del mismo negro que tu app (#030303).
// - userScalable: false -> Evita que el usuario haga zoom por accidente al tocar botones rápido.
export const viewport: Viewport = {
  themeColor: "#030303",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 2. METADATOS Y CONEXIÓN PWA
export const metadata: Metadata = {
  title: "SetlistPro",
  description: "El sistema operativo para tu banda.",
  manifest: "/manifest.json", // <--- AQUÍ CONECTAMOS EL ARCHIVO DE LA APP
  
  // Configuración específica para iPhone (iOS)
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Hace que la app cubra toda la pantalla, incluso bajo la hora/batería
    title: "SetlistPro",
  },
  
  // Evita que el celular piense que números aleatorios son teléfonos
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}