import { z } from "zod";

export const employeeServicesFiltersSchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  status: z.string().optional(),
}).strict();

export type EmployeeServicesFilters = z.infer<typeof employeeServicesFiltersSchema>;
