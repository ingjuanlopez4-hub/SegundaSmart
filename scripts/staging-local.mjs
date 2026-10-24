import { cp, mkdir, symlink, access, readFile, chmod } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import https from "node:https";
import http from "node:http";

// No dotenv files, existing databases, photos or Vercel links enter this workspace.
const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "artifacts", "staging-local");
const workspace = path.join(directory, "workspace");
const env = {
  ...process.env,
  NODE_OPTIONS: "",
  NODE_ENV: "production",
  DATABASE_URL: `file:${path.join(directory, "staging.db")}`,
  APP_URL: "https://localhost:3443",
  TURSO_DATABASE_URL: "",
  TURSO_AUTH_TOKEN: "",
  BLOB_READ_WRITE_TOKEN: "",
  OPENAI_API_KEY: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

function run(command, args, cwd = workspace) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command}: exit ${code}`)));
  });
}

const action = process.argv[2];
if (action === "prepare") {
  await mkdir(workspace, { recursive: true });
  for (const entry of ["src", "scripts", "prisma", "package.json", "package-lock.json", "next.config.mjs", "next-env.d.ts", "tsconfig.json", "vitest.config.ts", "eslint.config.mjs"]) {
    await cp(path.join(root, entry), path.join(workspace, entry), {
      recursive: true,
      filter: (source) => !/\.(db|db-journal|db-wal|db-shm)$/.test(source),
    });
  }
  await cp(path.join(root, "public"), path.join(workspace, "public"), {
    recursive: true,
    filter: (source) => source !== path.join(root, "public", "uploads"),
  });
  await mkdir(path.join(workspace, "public", "uploads"), { recursive: true });
  try { await access(path.join(workspace, "node_modules")); }
  catch { await symlink(path.join(root, "node_modules"), path.join(workspace, "node_modules"), "dir"); }
  await run(process.execPath, ["scripts/migrate-database.mjs"]);
  try { await access(path.join(directory, "localhost.key")); }
  catch {
    await run("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "30", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1", "-keyout", "localhost.key", "-out", "localhost.crt"], directory);
    await chmod(path.join(directory, "localhost.key"), 0o600);
  }
  console.log(`Entorno local aislado: ${directory}`);
} else if (action === "build") {
  await run(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build"]);
} else if (action === "test") {
  // Vitest uses a second database, never the staging database.
  env.NODE_ENV = "test";
  env.DATABASE_URL = `file:${path.join(directory, "regression.db")}`;
  await run(process.execPath, ["scripts/migrate-database.mjs"]);
  await run(process.execPath, [path.join(root, "node_modules/vitest/vitest.mjs"), "run"]);
} else if (action === "start") {
  const child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3104"], { cwd: workspace, env, stdio: "inherit" });
  const server = https.createServer({
    key: await readFile(path.join(directory, "localhost.key")),
    cert: await readFile(path.join(directory, "localhost.crt")),
  }, (request, response) => {
    const upstream = http.request({ hostname: "127.0.0.1", port: 3104, method: request.method, path: request.url, headers: { ...request.headers, "x-forwarded-proto": "https", "x-forwarded-host": request.headers.host } }, (result) => {
      response.writeHead(result.statusCode ?? 502, result.headers);
      result.pipe(response);
    });
    upstream.on("error", () => { response.writeHead(502); response.end("Servidor local no disponible; reintenta."); });
    request.pipe(upstream);
  });
  server.on("error", (error) => { console.error(error); child.kill(); process.exitCode = 1; });
  server.listen(3443, "127.0.0.1", () => console.log("HTTPS local: https://localhost:3443 (certificado autofirmado; solo host)"));
  const stop = () => { server.close(); child.kill(); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("error", (error) => { console.error(error); server.close(); process.exitCode = 1; });
  child.on("exit", (code) => { server.close(); process.exitCode = code ?? 1; });
} else {
  throw new Error("Uso: node scripts/staging-local.mjs prepare|build|test|start");
}
