const PUBLIC_PRODUCT_PATH = /^\/catalogo\/([^/]+)\/productos\/([^/]+)\/?$/;

export function generateProductReference(): string {
  return `PZ-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export function normalizeProductReference(value: string): string {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return "";
  if (compact.startsWith("PZ-")) return compact;
  if (compact.startsWith("PZ")) return `PZ-${compact.slice(2).replace(/^-/, "")}`;
  return compact;
}

export function getProductIdFromPublicUrl(value: string, expectedSlug: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let pathname: string;
  try {
    pathname = new URL(trimmed, "https://segunda-smart.invalid").pathname;
  } catch {
    return null;
  }

  const match = PUBLIC_PRODUCT_PATH.exec(pathname);
  if (!match) return null;

  const [, encodedSlug, encodedId] = match;
  try {
    const slug = decodeURIComponent(encodedSlug);
    const id = decodeURIComponent(encodedId);
    return slug === expectedSlug && /^c[a-z0-9]{20,}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function publicProductPath(slug: string, productId: string): string {
  return `/catalogo/${encodeURIComponent(slug)}/productos/${encodeURIComponent(productId)}`;
}

export function absoluteAppUrl(pathname: string, requestUrl?: string): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return new URL(pathname, `${configured.replace(/\/$/, "")}/`).toString();
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL es obligatoria en producción");
  return new URL(pathname, requestUrl ?? "http://localhost:3000").toString();
}
