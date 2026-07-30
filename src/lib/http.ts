import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { firstZodError } from "./validation";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) return apiError(firstZodError(error), 422);
  console.error(error);
  return apiError("No pudimos completar la operación. Intenta de nuevo.", 500);
}
