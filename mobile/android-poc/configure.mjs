import { writeFile } from "node:fs/promises";
import { createConfig } from "./config.mjs";

const config = createConfig(process.env.ANDROID_POC_ORIGIN);
await writeFile(new URL("./capacitor.config.json", import.meta.url), `${JSON.stringify(config, null, 2)}\n`);
// The error document is local and has no native bridge. Retry is always a GET
// to login, never a replay of a potentially committed sale or product POST.
const page = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>No se pudo conectar · SegundaSmart</title>
<style>body{font:1.125rem/1.6 system-ui;margin:0;padding:32px 24px;background:#f6f8f6;color:#183c2e}main{max-width:36rem;margin:auto}a{display:inline-block;padding:14px 24px;background:#20634c;color:white;border-radius:12px}a:focus-visible{outline:3px solid #183c2e;outline-offset:4px}</style>
</head><body><main><h1>No se pudo conectar</h1>
<p>Comprueba tu conexión y vuelve a intentar. SegundaSmart necesita conexión para consultar y guardar.</p>
<p>Si estabas registrando una venta o una pieza, revisa el inventario y las ventas antes de enviarla otra vez: el servidor podría haberla recibido.</p>
<a href="${config.server.url}/login">Volver al acceso</a></main></body></html>\n`;
await writeFile(new URL("./www/connection-error.html", import.meta.url), page);
console.info("Configuración de prueba generada. No usar server.url para distribución.");
