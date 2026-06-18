import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(200).optional(),
  fantasyName: z.string().max(200).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  niche: z.string().optional(),
  address: z.any().optional(),
}).strict();

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
