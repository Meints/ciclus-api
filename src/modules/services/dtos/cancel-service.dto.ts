import { z } from "zod";

export const cancelServiceSchema = z.object({
  reason: z.string().max(500).optional(),
}).strict();

export type CancelServiceInput = z.infer<typeof cancelServiceSchema>;
