import { z } from "zod";

export const userFiltersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  role: z.enum(["OWNER", "ADMIN", "TECHNICIAN"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
}).strict();

export type UserFilters = z.infer<typeof userFiltersSchema>;
