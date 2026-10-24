import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { photoDimensions } from "./photo-dimensions";

describe("photo header bounds before browser decoding", () => {
  it.each(["jpeg", "png", "webp"] as const)("reads real %s dimensions", async (format) => {
    const bytes = await sharp({ create: { width: 120, height: 240, channels: 3, background: "green" } }).toFormat(format).toBuffer();
    expect(photoDimensions(bytes, `image/${format}`)).toEqual({ width: 120, height: 240 });
  });

  it("reads lossless WebP and extended WebP with EXIF", async () => {
    for (const lossless of [true, false]) {
      const bytes = await sharp({ create: { width: 240, height: 120, channels: 3, background: "green" } }).webp({ lossless }).withMetadata({ orientation: 6 }).toBuffer();
      expect(photoDimensions(bytes, "image/webp")).toEqual({ width: 240, height: 120 });
    }
  });

  it("rejects empty, malformed, mismatched and truncated headers", async () => {
    for (const mime of ["image/jpeg", "image/png", "image/webp", "image/heic"]) {
      expect(() => photoDimensions(new Uint8Array(), mime)).toThrow();
      expect(() => photoDimensions(new Uint8Array([1, 2, 3, 4]), mime)).toThrow();
    }
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "red" } }).png().toBuffer();
    expect(() => photoDimensions(png, "image/jpeg")).toThrow();
    expect(() => photoDimensions(png.subarray(0, png.length - 12), "image/png")).toThrow();
  });

  it("rejects enormous decompression and APNG before bitmap allocation", async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "red" } }).png().toBuffer();
    const oversized = Buffer.from(png);
    oversized.writeUInt32BE(16385, 16);
    expect(() => photoDimensions(oversized, "image/png")).toThrow(/resolución/);
    const animated = Buffer.from(png);
    animated.write("acTL", 37, "ascii");
    expect(() => photoDimensions(animated, "image/png")).toThrow();
  });
});
