import { z } from "zod";

export const createContractSchema = z.object({
  customerId: z.string().uuid(),
  frequency: z.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  amount: z.number().positive(),
  employeeId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateContractSchema = z.object({
  frequency: z.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]).optional(),
  endDate: z.string().datetime().optional(),
  amount: z.number().positive().optional(),
  employeeId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const cancelContractSchema = z.object({
  reason: z.string().min(1),
});

export const contractsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  frequency: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
});

export const contractServicesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
