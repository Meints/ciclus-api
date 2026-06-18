import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
}).strict();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
