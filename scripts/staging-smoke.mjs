import https from "node:https";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";

// Fixed local destination: this script cannot target a production URL.
const ca = await readFile(new URL("../artifacts/staging-local/localhost.crt", import.meta.url));
function request(path, method = "GET", data, cookie) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : undefined;
    const req = https.request({ hostname: "localhost", family: 4, port: 3443, path, method, ca,
      headers: { ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(body) } : {}), ...(cookie ? { cookie } : {}) },
    }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (part) => { text += part; });
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, text }));
    });
    req.on("error", reject);
    req.end(body);
  });
}
assert.equal((await request("/login")).status, 200);
assert.equal((await request("/api/negocios", "POST", {})).status, 401);
const result = await request("/api/auth/register", "POST", {
  name: "Persona QA local", businessName: "Negocio QA local",
  email: `qa-${randomBytes(8).toString("hex")}@segundasmart.invalid`,
  password: randomBytes(24).toString("base64url"),
});
assert.equal(result.status, 201);
const setCookie = result.headers["set-cookie"]?.[0];
assert.ok(setCookie && /HttpOnly/i.test(setCookie) && /Secure/i.test(setCookie) && /SameSite=Lax/i.test(setCookie));
const cookie = setCookie.split(";")[0];
assert.equal((await request("/app", "GET", undefined, cookie)).status, 200);
assert.equal((await request("/api/auth/logout", "POST", undefined, cookie)).status, 200);
assert.equal((await request("/api/negocios", "POST", {}, cookie)).status, 401);
console.log("6 comprobaciones HTTPS locales aprobadas: acceso, protección, registro QA, cookie segura, sesión y logout. Cuenta sintética persistida solo en staging.db; credenciales no registradas.");
