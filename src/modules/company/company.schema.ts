import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().optional(),
  fantasyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.any().optional(),
  niche: z.string().optional(),
});

export const usageSchema = z.object({});
