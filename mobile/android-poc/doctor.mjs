import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

let failures = 0;
function check(label, ok) {
  console.info(`${ok ? "OK" : "FALTA"}: ${label}`);
  if (!ok) failures++;
}
check("Node.js >=22", Number(process.versions.node.split(".")[0]) >= 22);
const java = spawnSync("java", ["-version"], { encoding: "utf8" });
const javaMajor = /version "(\d+)/.exec(`${java.stdout ?? ""}${java.stderr ?? ""}`)?.[1];
check("JDK 21 para la prueba (selecciona JAVA_HOME y PATH)", java.status === 0 && javaMajor === "21");
check("adb", spawnSync("adb", ["version"], { stdio: "ignore" }).status === 0);
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
check("ANDROID_HOME/ANDROID_SDK_ROOT con plataforma API 36", Boolean(sdk && existsSync(path.join(sdk, "platforms", "android-36", "android.jar"))));
check("Capacitor instalado", existsSync(new URL("./node_modules/@capacitor/cli/package.json", import.meta.url)));
check("Proyecto Android generado", existsSync(new URL("./android/gradlew", import.meta.url)));
console.info("Este diagnóstico no acredita compilación, dispositivo conectado ni recorridos Android.");
process.exitCode = failures ? 1 : 0;
