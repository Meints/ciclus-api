import { z } from "zod";

export const linkEquipmentSchema = z.object({
  equipmentIds: z.array(z.string().uuid()).min(1, "Selecione pelo menos um equipamento"),
}).strict();

export type LinkEquipmentInput = z.infer<typeof linkEquipmentSchema>;
