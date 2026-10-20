import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contentTypes = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

// Las fotografías ya forman parte del catálogo público. Esta ruta permite
// servir altas locales posteriores al arranque de `next start`.
export async function GET(_request: Request, { params }: { params: Promise<{ businessId: string; filename: string }> }) {
  const { businessId, filename } = await params;
  const match = /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.(jpg|png|webp)$/.exec(filename);
  if (!/^c[a-z0-9]{24}$/.test(businessId) || !match) return new Response(null, { status: 404 });

  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "uploads", businessId, filename));
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": contentTypes[match[2] as keyof typeof contentTypes],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    console.error("No se pudo leer la fotografía local", error);
    return new Response(null, { status: 500 });
  }
}
