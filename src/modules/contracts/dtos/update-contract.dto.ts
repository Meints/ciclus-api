import { z } from "zod";
import { contractFrequencySchema } from "./create-contract.dto";

export const updateContractSchema = z.object({
  customerId: z.string().uuid().optional(),
  frequency: contractFrequencySchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.number().positive().optional(),
  employeeId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
}).strict();

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
