import { z } from "zod";

export const confirmParamsSchema = z.object({
  token: z.string(),
});

export const confirmBodySchema = z.object({
  name: z.string().max(255).optional().default(""),
  document: z
    .string()
    .regex(/^\d+$/, "Documento deve conter apenas números")
    .min(11, "Documento deve ter no mínimo 11 dígitos")
    .max(14, "Documento deve ter no máximo 14 dígitos")
    .optional(),
  documentType: z.enum(["CPF", "CNPJ"]).optional(),
  consent: z
    .boolean()
    .optional()
    .default(true)
    .refine((v) => v === true, { message: "Consentimento é obrigatório" }),
});
