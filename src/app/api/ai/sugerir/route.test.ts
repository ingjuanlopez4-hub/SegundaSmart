import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productSchema } from "@/lib/validation";

const mocks = vi.hoisted(() => ({ requireApiUser: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireApiUser: mocks.requireApiUser }));

import { POST } from "./route";

const input = { name: "Silla de madera", category: "Hogar", condition: "Buen estado", cost: "100" };

function request(overrides: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/ai/sugerir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, ...overrides }) });
}

function aiResponse(content: string) {
  return Response.json({ choices: [{ message: { content } }] });
}

async function expectUsable(response: Response, source: "ai" | "local", overrides: Record<string, string> = {}) {
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.source).toBe(source);
  expect(productSchema.safeParse({ ...input, ...overrides, description: result.description, price: result.suggestedPrice, suggestedPrice: result.suggestedPrice, defects: "Marcas de uso visibles" }).success).toBe(true);
  expect(Number(result.suggestedMin)).toBeGreaterThanOrEqual(0.01);
  expect(Number(result.suggestedMin)).toBeLessThanOrEqual(Number(result.suggestedPrice));
  expect(Number(result.suggestedMax)).toBeGreaterThanOrEqual(Number(result.suggestedPrice));
  expect(Number(result.suggestedMax)).toBeLessThanOrEqual(1_000_000);
  return result;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.requireApiUser.mockResolvedValue({ businessId: "owned-business" });
});

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("sugerencias utilizables y alternativa local", () => {
  it.each(["Como nuevo", "Buen estado", "Con detalles"])("mantiene el precio y rango dentro de los límites con costo máximo (%s)", async (condition) => {
    await expectUsable(await POST(request({ cost: "1000000", condition })), "local", { cost: "1000000", condition });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("ofrece un precio válido cuando el costo es cero", async () => {
    await expectUsable(await POST(request({ cost: "0" })), "local", { cost: "0" });
  });

  it.each([0.01, 0.02, 1, 123.456, 1_000_000])("normaliza el precio IA %s y mantiene un rango que lo contiene", async (price) => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    mocks.fetch.mockResolvedValue(aiResponse(JSON.stringify({ description: "  Silla usada de madera.  ", suggestedPrice: price })));
    const result = await expectUsable(await POST(request()), "ai");
    expect(result.description).toBe("Silla usada de madera.");
    expect(result.suggestedPrice).toMatch(/^\d+\.\d{2}$/);
    const call = mocks.fetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(JSON.parse(body.messages[1].content).cost).toBe(100);
    expect(JSON.parse(body.messages[1].content)).not.toHaveProperty("businessId");
  });

  it.each([
    "not json", "null", "{}",
    JSON.stringify({ description: "            ", suggestedPrice: 100 }),
    JSON.stringify({ description: "Silla usada de madera.", suggestedPrice: 0.001 }),
    JSON.stringify({ description: "Silla usada de madera.", suggestedPrice: 1_000_001 }),
    JSON.stringify({ description: "Silla usada de madera.", suggestedPrice: "100" }),
    '{"description":"Silla usada de madera.","suggestedPrice":1e400}',
  ])("recupera una sugerencia local ante contenido IA inválido (%s)", async (content) => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    mocks.fetch.mockResolvedValue(aiResponse(content));
    await expectUsable(await POST(request()), "local");
  });

  it.each(["network", "timeout", "http", "invalid-json"])("mantiene la alternativa local si falla el proveedor (%s)", async (failure) => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    if (failure === "network") mocks.fetch.mockRejectedValue(new TypeError("network error"));
    if (failure === "timeout") mocks.fetch.mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    if (failure === "http") mocks.fetch.mockResolvedValue(new Response(null, { status: 429 }));
    if (failure === "invalid-json") mocks.fetch.mockResolvedValue(new Response("upstream unavailable"));
    await expectUsable(await POST(request()), "local");
  });

  it("requiere sesión antes de consultar al proveedor", async () => {
    mocks.requireApiUser.mockResolvedValue(null);
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    expect((await POST(request())).status).toBe(401);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each([{ cost: "1000000.01" }, { cost: "-1" }, { name: "  " }, { condition: "No válido" }])("valida las entradas antes de consultar al proveedor (%j)", async (overrides) => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    expect((await POST(request(overrides))).status).toBe(422);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
