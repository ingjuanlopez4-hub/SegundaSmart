import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SegundaSmart", template: "%s · SegundaSmart" },
  description: "Inventario y catálogo para negocios de segunda mano",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
