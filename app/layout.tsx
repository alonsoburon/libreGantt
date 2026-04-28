import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gantt — local first",
  description: "Editor de cartas Gantt simple, rápido y local-first",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230E1116'/%3E%3Crect x='6' y='8' width='14' height='4' rx='1' fill='%23C2410C'/%3E%3Crect x='10' y='14' width='16' height='4' rx='1' fill='%231E3A5F'/%3E%3Crect x='8' y='20' width='10' height='4' rx='1' fill='%234F6F52'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
