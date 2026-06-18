import { z } from "zod";

export const cancelContractSchema = z.object({
  reason: z.string().min(1, "Motivo do cancelamento é obrigatório").max(500),
}).strict();

export type CancelContractInput = z.infer<typeof cancelContractSchema>;
