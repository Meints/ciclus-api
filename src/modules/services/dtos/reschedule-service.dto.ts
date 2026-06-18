import { z } from "zod";

export const rescheduleServiceSchema = z.object({
  scheduledAt: z.string().min(1, "Nova data é obrigatória"),
}).strict();

export type RescheduleServiceInput = z.infer<typeof rescheduleServiceSchema>;
