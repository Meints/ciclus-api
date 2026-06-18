import { z } from "zod";

export const createServiceSchema = z.object({
  contractId: z.string().uuid().optional(),
  customerId: z.string().uuid("Cliente é obrigatório"),
  serviceType: z.string().min(1, "Tipo de serviço é obrigatório"),
  scheduledDate: z.string().min(1, "Data agendada é obrigatória"),
  employeeId: z.string().uuid().optional(),
  equipmentIds: z.array(z.string().uuid()).optional().default([]),
}).strict();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
