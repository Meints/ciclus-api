import { z } from "zod";

export const rescheduleServiceSchema = z.object({
  scheduledAt: z.string().min(1, "Nova data é obrigatória"),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:mm").optional(),
  estimatedDurationMinutes: z.number().int().min(1).optional(),
}).strict();

export type RescheduleServiceInput = z.infer<typeof rescheduleServiceSchema>;
