import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

type StoredPhoto = {
  url: string;
  remove: () => Promise<void>;
};

export async function storeProductPhoto(businessId: string, bytes: Uint8Array, extension: string): Promise<StoredPhoto> {
  const filename = `${crypto.randomUUID()}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${businessId}/${filename}`, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: false,
    });
    return {
      url: blob.url,
      remove: () => del(blob.url),
    };
  }

  const directory = path.join(process.cwd(), "public", "uploads", businessId);
  await mkdir(directory, { recursive: true });
  const savedPath = path.join(directory, filename);
  await writeFile(savedPath, bytes, { flag: "wx" });
  return {
    url: `/uploads/${businessId}/${filename}`,
    remove: () => unlink(savedPath),
  };
}
