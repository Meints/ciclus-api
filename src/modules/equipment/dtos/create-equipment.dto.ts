import { z } from "zod";

export const createEquipmentSchema = z.object({
  type: z.string().min(1, "Tipo é obrigatório"),
  brand: z.string().optional(),
  model: z.string().optional(),
  capacity: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  installedAt: z.string().optional(),
  notes: z.string().max(500).optional(),
}).strict();

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
