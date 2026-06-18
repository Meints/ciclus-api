import { z } from "zod";

export const contractFiltersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "ABOUT_TO_EXPIRE", "EXPIRED", "CANCELLED"]).optional(),
  customerId: z.string().uuid().optional(),
  frequency: z.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]).optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
}).strict();

export type ContractFilters = z.infer<typeof contractFiltersSchema>;
