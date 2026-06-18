import { z } from "zod";

export const completeServiceSchema = z.object({
  executionNotes: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  equipmentNotes: z
    .array(
      z.object({
        equipmentId: z.string().uuid(),
        notes: z.string(),
      }),
    )
    .optional(),
});

export const cancelServiceSchema = z.object({
  reason: z.string().min(1),
});

export const rescheduleServiceSchema = z.object({
  scheduledAt: z.string().datetime(),
});

export const linkEquipmentSchema = z.object({
  equipmentIds: z.array(z.string().uuid()).min(1),
});

export const servicesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
});
