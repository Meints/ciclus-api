import { z } from "zod";

export const serviceFiltersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CONFIRMED", "CANCELLED"]).optional(),
  employeeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
}).strict();

export type ServiceFilters = z.infer<typeof serviceFiltersSchema>;
