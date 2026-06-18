import { z } from "zod";

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  fantasyName: z.string().max(200).nullable().optional(),
  email: z.string().email().optional().or(z.literal("")),
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
  notes: z.string().max(500).nullable().optional(),
}).strict();

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
