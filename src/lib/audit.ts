import { prisma } from "../config/prisma";

export interface AuditLogInput {
  companyId: string;
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const data: Record<string, unknown> = {
    companyId: input.companyId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
  };

  if (input.userId !== undefined) data.userId = input.userId;
  if (input.oldData !== undefined) data.oldData = input.oldData;
  if (input.newData !== undefined) data.newData = input.newData;

  await prisma.auditLog.create({ data: data as any });
}
