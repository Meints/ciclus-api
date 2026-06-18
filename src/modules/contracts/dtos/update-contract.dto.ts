import { z } from "zod";
import { contractFrequencySchema } from "./create-contract.dto";

export const updateContractSchema = z.object({
  frequency: contractFrequencySchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.number().positive().optional(),
  employeeId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  status: z.enum(["ACTIVE", "ABOUT_TO_EXPIRE", "EXPIRED", "CANCELLED"]).optional(),
}).strict();

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
