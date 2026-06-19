import { z } from "zod";

export const contractFrequencySchema = z.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]);

export const createContractSchema = z.object({
  customerId: z.string().uuid("Cliente inválido"),
  frequency: contractFrequencySchema,
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de término é obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  employeeId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
}).strict();

export type CreateContractInput = z.infer<typeof createContractSchema>;
