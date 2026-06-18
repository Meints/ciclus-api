import { z } from "zod";

export const updateEquipmentSchema = z.object({
  type: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  capacity: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  installedAt: z.string().optional(),
  notes: z.string().max(500).optional(),
}).strict();

export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
