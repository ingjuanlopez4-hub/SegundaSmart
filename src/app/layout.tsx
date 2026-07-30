import type { Metadata } from "next";
import { Archivo_Black, Azeret_Mono, Chivo } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Chivo({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-body" });
const utility = Azeret_Mono({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-utility" });

export const metadata: Metadata = {
  title: { default: "SegundaSmart", template: "%s · SegundaSmart" },
  description: "Inventario y catálogo para negocios de segunda mano",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable} ${utility.variable}`}>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
