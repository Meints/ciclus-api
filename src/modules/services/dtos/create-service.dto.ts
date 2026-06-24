import { z } from "zod";

const DEFAULT_DURATION_MINUTES: Record<string, number> = {
  PREVENTIVE_MAINTENANCE: 60,
  CORRECTIVE_MAINTENANCE: 90,
  PMOC: 180,
  INSTALLATION: 120,
  UNINSTALLATION: 60,
  GAS_RECHARGE: 45,
  CLEANING: 90,
  INSPECTION: 30,
};

export const createServiceSchema = z.object({
  contractId: z.string().uuid().optional(),
  customerId: z.string().uuid("Cliente é obrigatório"),
  serviceType: z.string().min(1, "Tipo de serviço é obrigatório"),
  scheduledDate: z.string().min(1, "Data agendada é obrigatória"),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:mm").optional(),
  employeeId: z.string().uuid().optional(),
  estimatedDurationMinutes: z.number().int().min(1).optional(),
  equipmentIds: z.array(z.string().uuid()).optional().default([]),
}).strict();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export function getDefaultDuration(serviceType: string): number {
  return DEFAULT_DURATION_MINUTES[serviceType] ?? 60;
}
