import { z } from "zod";

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
}).strict();

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
