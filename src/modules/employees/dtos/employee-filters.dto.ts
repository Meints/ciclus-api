import { z } from "zod";

export const employeeFiltersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  isActive: z.enum(["true", "false"]).optional(),
}).strict();

export type EmployeeFilters = z.infer<typeof employeeFiltersSchema>;
