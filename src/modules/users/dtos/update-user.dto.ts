import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  role: z.enum(["ADMIN", "TECHNICIAN", "OWNER"]).optional(),
}).strict();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
