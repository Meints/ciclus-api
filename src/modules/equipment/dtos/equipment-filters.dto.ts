import { z } from "zod";

export const equipmentFiltersSchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  type: z.string().optional(),
}).strict();

export type EquipmentFilters = z.infer<typeof equipmentFiltersSchema>;
