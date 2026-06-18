import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(200),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "TECHNICIAN"]),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
}).strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
