import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
}).strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
