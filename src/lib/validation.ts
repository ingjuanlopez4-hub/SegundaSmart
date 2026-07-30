import { z } from "zod";
import { pesosToCents } from "./money";

const money = z.string().trim().min(1, "Escribe un importe").transform(pesosToCents).pipe(
  z.number().int().min(0, "El importe no puede ser negativo").max(100_000_000, "El importe es demasiado alto"),
);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  businessName: z.string().trim().min(2, "Escribe el nombre del negocio").max(100),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido").max(254),
  password: z.string().min(8, "Usa al menos 8 caracteres").max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe tu contraseña").max(128),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del producto").max(120),
  category: z.string().trim().min(2, "Escribe una categoría").max(60),
  condition: z.enum(["Como nuevo", "Buen estado", "Con detalles"]),
  description: z.string().trim().min(10, "Agrega al menos 10 caracteres").max(1200),
  cost: money,
  price: money.pipe(z.number().positive("El precio debe ser mayor a cero")),
  suggestedPrice: z.union([z.literal(""), money]).optional(),
});

export const aiSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  condition: z.enum(["Como nuevo", "Buen estado", "Con detalles"]),
  cost: money,
});

export const saleSchema = z.object({
  productId: z.string().cuid("Producto inválido"),
  amount: money.pipe(z.number().positive("El importe debe ser mayor a cero")),
});

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisa los datos enviados";
}
