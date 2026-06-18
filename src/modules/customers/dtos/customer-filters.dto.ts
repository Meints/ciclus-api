import { z } from "zod";

export const customerFiltersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
}).strict();

export type CustomerFilters = z.infer<typeof customerFiltersSchema>;
