import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(200),
  fantasyName: z.string().max(200).optional(),
  documentType: z.enum(["CPF", "CNPJ"]),
  document: z.string().min(11).max(18),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.object({
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
}).strict();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
