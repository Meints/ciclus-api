import { z } from "zod";

export const equipmentNoteSchema = z.object({
  equipmentId: z.string().uuid(),
  note: z.string().max(500),
});

export const completeServiceSchema = z.object({
  executionNotes: z.string().min(1, "Observações são obrigatórias").max(2000).optional(),
  durationMinutes: z.number().int().positive().optional(),
  equipmentNotes: z.array(equipmentNoteSchema).optional(),
}).strict();

export type CompleteServiceInput = z.infer<typeof completeServiceSchema>;
