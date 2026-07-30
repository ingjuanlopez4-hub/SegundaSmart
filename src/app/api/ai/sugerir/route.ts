import { requireApiUser } from "@/lib/auth";
import { aiSchema } from "@/lib/validation";
import { apiError, handleApiError } from "@/lib/http";

type Suggestion = {
  description: string;
  suggestedPrice: string;
  suggestedMin: string;
  suggestedMax: string;
  explanation: string;
  source: "ai" | "local";
};

function withRange(
  suggestion: Omit<Suggestion, "suggestedMin" | "suggestedMax" | "explanation">,
  condition: string,
): Suggestion {
  const priceCents = Math.round(Number(suggestion.suggestedPrice) * 100);
  const roundToFivePesos = (cents: number) => Math.max(100, Math.round(cents / 500) * 500);
  return {
    ...suggestion,
    suggestedMin: (roundToFivePesos(priceCents * 0.9) / 100).toFixed(2),
    suggestedMax: (roundToFivePesos(priceCents * 1.1) / 100).toFixed(2),
    explanation: suggestion.source === "ai"
      ? `Rango orientativo alrededor de la sugerencia, considerando el estado “${condition}”. Compáralo con tu mercado.`
      : `Rango orientativo calculado desde tu costo y el estado “${condition}”. Compáralo con piezas similares.`,
  };
}

function localSuggestion(input: { name: string; category: string; condition: string; cost: number }): Suggestion {
  const factors: Record<string, number> = { "Como nuevo": 2.1, "Buen estado": 1.8, "Con detalles": 1.5 };
  const cents = Math.max(100, Math.ceil((input.cost * (factors[input.condition] ?? 1.8)) / 500) * 500);
  return withRange({
    description: `${input.name} de segunda mano en ${input.condition.toLowerCase()}. Pieza de la categoría ${input.category}, lista para encontrar un nuevo hogar. Revisa la fotografía y agrega aquí medidas, materiales o detalles importantes.`,
    suggestedPrice: (cents / 100).toFixed(2), source: "local",
  }, input.condition);
}

async function aiSuggestion(input: { name: string; category: string; condition: string; cost: number }): Promise<Suggestion | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", response_format: { type: "json_object" }, temperature: 0.4, messages: [
        { role: "system", content: "Eres valuador de artículos usados en México. Devuelve JSON estricto con description (español, honesta, máximo 500 caracteres, no inventes atributos) y suggestedPrice (número MXN)." },
        { role: "user", content: JSON.stringify({ ...input, cost: input.cost / 100 }) },
      ] }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}") as { description?: unknown; suggestedPrice?: unknown };
    if (typeof parsed.description !== "string" || parsed.description.length < 10 || parsed.description.length > 1200 || typeof parsed.suggestedPrice !== "number" || parsed.suggestedPrice <= 0 || parsed.suggestedPrice > 1_000_000) return null;
    return withRange({ description: parsed.description, suggestedPrice: parsed.suggestedPrice.toFixed(2), source: "ai" }, input.condition);
  } catch { return null; }
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiError("Inicia sesión para continuar", 401);
  try {
    const input = aiSchema.parse(await request.json());
    return Response.json((await aiSuggestion(input)) ?? localSuggestion(input));
  } catch (error) { return handleApiError(error); }
}
