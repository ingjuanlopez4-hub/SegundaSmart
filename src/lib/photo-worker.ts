import { photoDimensions } from "./photo-dimensions";
import { PHOTO_INPUT_LIMIT, PHOTO_TARGET_BYTES } from "./photo-limits";

// No DOM work/large pixel loops on the UI thread. Termination cancels decoding
// or encoding as well as reclaiming worker-owned buffers.
self.onmessage = async (event: MessageEvent<File>) => {
  let bitmap: ImageBitmap | undefined;
  let canvas: OffscreenCanvas | undefined;
  try {
    const file = event.data;
    if (!file.size || file.size > PHOTO_INPUT_LIMIT) throw new Error("Elige una foto de hasta 32 MiB.");
    const { width, height } = photoDimensions(new Uint8Array(await file.arrayBuffer()), file.type);
    // EXIF orientation is applied by the decoder, once. A width <= BOTH original
    // axes avoids upscaling even when EXIF swaps the dimensions.
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
      ...(Math.max(width, height) > 2048 ? { resizeWidth: Math.min(width, height, 2048), resizeQuality: "high" as const } : {}),
    });
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    let outputWidth = Math.max(1, Math.round(bitmap.width * scale));
    let outputHeight = Math.max(1, Math.round(bitmap.height * scale));
    for (let resize = 0; resize < 3; resize++) {
      canvas = new OffscreenCanvas(outputWidth, outputHeight);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No hay memoria suficiente para procesar la foto. Elige una de menor resolución.");
      context.fillStyle = "white";
      context.fillRect(0, 0, outputWidth, outputHeight);
      context.drawImage(bitmap, 0, 0, outputWidth, outputHeight);
      for (const quality of [0.88, 0.76, 0.64]) {
        // Canvas re-encoding omits EXIF (including GPS); bytes, MIME and filename
        // are all JPEG. It never copies original location metadata.
        const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
        // Avoid inflating small JPEGs at a higher encoder quality than needed.
        // Keep the useful-quality floor; very tiny PNGs may still have greater
        // JPEG container overhead after metadata removal/format normalization.
        if (blob.size > 0 && blob.size <= PHOTO_TARGET_BYTES
          && (blob.size <= file.size || quality === 0.64)) { self.postMessage({ blob }); return; }
      }
      canvas.width = canvas.height = 1;
      outputWidth = Math.max(1, Math.floor(outputWidth * 0.75));
      outputHeight = Math.max(1, Math.floor(outputHeight * 0.75));
    }
    throw new Error("No se pudo reducir la foto con calidad útil. Elige otra de menor resolución.");
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "No se pudo leer la foto. Elige otra de menor resolución." });
  } finally {
    bitmap?.close();
    if (canvas) canvas.width = canvas.height = 1;
  }
};
