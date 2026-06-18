import { z } from "zod";

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
}).strict();

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
