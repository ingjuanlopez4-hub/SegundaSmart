// Inspect headers before allocating decoded pixels. Unsupported/truncated headers
// fail closed; the full server decoder still validates the resulting upload.
export function photoDimensions(bytes: Uint8Array, mime: string): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number, length: number) => String.fromCharCode(...bytes.subarray(offset, offset + length));
  const invalid = () => { throw new Error("La foto no es una imagen estática válida. Elige otro JPG, PNG o WebP."); };
  let width = 0;
  let height = 0;
  if (mime === "image/png" && bytes.length >= 33 && text(1, 3) === "PNG" && view.getUint32(0) === 0x89504e47 && text(12, 4) === "IHDR") {
    width = view.getUint32(16); height = view.getUint32(20);
    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset);
      const type = text(offset + 4, 4);
      if (["acTL", "fcTL", "fdAT"].includes(type) || length > bytes.length - offset - 12) invalid();
      offset += length + 12;
      if (type === "IEND") break;
    }
    if (offset !== bytes.length || text(bytes.length - 8, 4) !== "IEND") invalid();
  } else if (mime === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 0xff) invalid();
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) invalid();
      if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
        height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break;
      }
      offset += length;
    }
  } else if (mime === "image/webp" && bytes.length >= 30 && text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    const kind = text(12, 4);
    const uint24 = (offset: number) => bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
    if (kind === "VP8X") {
      if (bytes[20] & 2) invalid(); // animation flag
      width = uint24(24) + 1; height = uint24(27) + 1;
    } else if (kind === "VP8 " && text(23, 3) === "\x9d\x01\x2a") {
      width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff;
    } else if (kind === "VP8L" && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
    }
  }
  if (!width || !height) invalid();
  if (width > 16384 || height > 16384 || width * height > 64 * 1024 * 1024) {
    throw new Error("La resolución de la foto es demasiado grande. Expórtala a un máximo de 64 megapíxeles y vuelve a elegirla.");
  }
  return { width, height };
}
