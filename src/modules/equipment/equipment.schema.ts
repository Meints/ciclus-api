import { z } from "zod";

export const createEquipmentSchema = z.object({
  type: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  capacity: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  installedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateEquipmentSchema = z.object({
  type: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  capacity: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  installedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const toggleEquipmentSchema = z.object({});

export const equipmentQuerySchema = z.object({
  isActive: z.string().optional(),
  type: z.string().optional(),
});
