// The server remains authoritative. Leave headroom for multipart/proxy limits.
import { PHOTO_INPUT_LIMIT, PHOTO_TARGET_BYTES } from "./photo-limits";

export function prepareProductPhoto(file: File, signal: AbortSignal): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Elige una fotografía JPG, PNG o WebP; convierte HEIC a JPG antes de seleccionarla."));
  }
  if (!file.size || file.size > PHOTO_INPUT_LIMIT) {
    return Promise.reject(new Error("Elige una fotografía no vacía de hasta 32 MiB, o expórtala a menor resolución."));
  }
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Cancelado", "AbortError")); return; }
    let worker: Worker;
    try {
      worker = new Worker(new URL("./photo-worker.ts", import.meta.url));
    } catch {
      reject(new Error("No se pudo iniciar el procesamiento de fotos. Actualiza Android System WebView o prueba desde un navegador actualizado."));
      return;
    }
    const finish = (error?: Error, result?: File) => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", cancel);
      worker.terminate();
      if (error) reject(error);
      else resolve(result!);
    };
    const cancel = () => finish(new DOMException("Cancelado", "AbortError"));
    const timeout = setTimeout(() => finish(new Error("La foto tardó demasiado en procesarse. Expórtala a menor resolución y vuelve a elegirla.")), 30_000);
    signal.addEventListener("abort", cancel, { once: true });
    worker.onerror = () => finish(new Error("No se pudo procesar la foto en este dispositivo. Prueba una JPG de menor resolución."));
    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => {
      const { blob, error } = event.data;
      if (error || !blob || blob.type !== "image/jpeg" || !blob.size || blob.size > PHOTO_TARGET_BYTES) {
        finish(new Error(error || "No se pudo reducir la fotografía. Elige otra de menor resolución."));
      } else {
        finish(undefined, new File([blob], "pieza.jpg", { type: blob.type }));
      }
    };
    worker.postMessage(file);
  });
}
