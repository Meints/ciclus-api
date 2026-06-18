import { z } from "zod";
import { AppError } from "./app-error";

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten();
    throw new AppError("Dados inválidos", 400, "VALIDATION_ERROR", errors);
  }
  return result.data;
}
