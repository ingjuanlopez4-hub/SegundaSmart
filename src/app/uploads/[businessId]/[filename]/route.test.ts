import { beforeEach, describe, expect, it, vi } from "vitest";
import path from "node:path";

const mocks = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));

import { GET } from "./route";

const businessId = "cmvg996uc0000jf716pwmp7jx";
const filename = "43a3e8c5-bc9b-4a65-aafc-91ecb026f9a9.png";

function getPhoto(business = businessId, file = filename) {
  return GET(new Request("http://localhost/uploads/photo"), { params: Promise.resolve({ businessId: business, filename: file }) });
}

beforeEach(() => { vi.resetAllMocks(); });

describe("fotografías locales creadas después del arranque", () => {
  it.each([["png", "image/png"], ["jpg", "image/jpeg"], ["webp", "image/webp"]])("sirve los bytes de una foto %s con tipo correcto", async (extension, type) => {
    const bytes = new Uint8Array([1, 2, 3]);
    mocks.readFile.mockResolvedValue(bytes);
    const file = filename.replace(/png$/, extension);
    const response = await getPhoto(businessId, file);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(type);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toContain("immutable");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(mocks.readFile).toHaveBeenCalledWith(path.join(process.cwd(), "public", "uploads", businessId, file));
  });

  it.each([
    ["..", filename],
    ["../private", filename],
    [businessId, "../../.env"],
    [businessId, filename + ".html"],
    [businessId, "photo.svg"],
    [businessId, filename + "/other.png"],
  ])("rechaza rutas y nombres no generados por la aplicación (%s, %s)", async (business, file) => {
    const response = await getPhoto(business, file);
    expect(response.status).toBe(404);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("devuelve 404 si la foto no existe", async () => {
    mocks.readFile.mockRejectedValue(Object.assign(new Error("not found"), { code: "ENOENT" }));
    expect((await getPhoto()).status).toBe(404);
  });
});
