import { z } from "zod";

export const updateServiceSchema = z.object({
  contractId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  serviceType: z.string().min(1).optional(),
  scheduledDate: z.string().min(1).optional(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:mm").nullable().optional(),
  employeeId: z.string().nullable().optional(),
  equipmentIds: z.array(z.string()).optional(),
}).strict();

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
