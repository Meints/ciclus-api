import { z } from "zod";

export const equipmentNoteSchema = z.object({
  equipmentId: z.string().uuid(),
  note: z.string().max(500),
});

export const completeServiceSchema = z.object({
  executionNotes: z.string().min(1, "Observações são obrigatórias").max(2000).optional(),
  durationMinutes: z.number().int().positive().optional(),
  equipmentNotes: z.array(equipmentNoteSchema).optional(),
  checklistData: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const updateChecklistSchema = z.object({
  checklistData: z.record(z.string(), z.unknown()),
}).strict();

export type CompleteServiceInput = z.infer<typeof completeServiceSchema>;
