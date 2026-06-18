import { prisma } from "../../config/prisma";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function getSummary(companyId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    activeCustomers,
    activeContracts,
    scheduledServices,
    completedServices,
    unconfirmedServices,
    aboutToExpireContracts,
    revenueAgg,
  ] = await Promise.all([
    prisma.customer.count({
      where: { companyId, deletedAt: null, isActive: true },
    }),
    prisma.contract.count({
      where: { companyId, deletedAt: null, status: "ACTIVE" },
    }),
    prisma.service.count({
      where: {
        companyId,
        deletedAt: null,
        scheduledAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.service.count({
      where: {
        companyId,
        deletedAt: null,
        status: "COMPLETED",
        completedDate: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.service.count({
      where: {
        companyId,
        deletedAt: null,
        status: "COMPLETED",
        confirmedAt: null,
        completedDate: { not: null },
      },
    }),
    prisma.contract.count({
      where: {
        companyId,
        deletedAt: null,
        status: "ABOUT_TO_EXPIRE",
        nextServiceDate: { gte: now, lte: addMonths(now, 1) },
      },
    }),
    prisma.service.aggregate({
      where: {
        companyId,
        deletedAt: null,
        isPaid: true,
        completedDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    activeCustomers,
    activeContracts,
    scheduledServices,
    completedServices,
    unconfirmedServices,
    aboutToExpireContracts,
    revenue: revenueAgg._sum.amount ? Number(revenueAgg._sum.amount).toFixed(2) : "0.00",
  };
}

export async function getUpcomingServices(
  companyId: string,
  start?: string,
  end?: string,
) {
  const now = new Date();
  const startDate = start ? new Date(start) : now;
  const endDate = end
    ? new Date(end)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const services = await prisma.service.findMany({
    where: {
      companyId,
      deletedAt: null,
      scheduledAt: { gte: startDate, lte: endDate },
    },
    include: {
      customer: { select: { id: true, name: true, address: true } },
      employee: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return services.map((s) => ({
    id: s.id,
    serviceNumber: s.serviceNumber,
    serviceType: s.serviceType,
    scheduledAt: s.scheduledAt,
    status: s.status,
    customer: {
      id: s.customer.id,
      name: s.customer.name,
      city:
        (s.customer.address as Record<string, unknown> | null)?.city ?? null,
    },
    employee: s.employee
      ? { id: s.employee.id, name: s.employee.name }
      : null,
  }));
}

export async function getExpiringContracts(companyId: string) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const contracts = await prisma.contract.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: "ACTIVE",
      endDate: { gte: now, lte: thirtyDaysFromNow },
    },
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { endDate: "asc" },
  });

  return contracts.map((c) => ({
    id: c.id,
    customerId: c.customerId,
    customerName: c.customer.name,
    endDate: c.endDate,
    frequency: c.frequency,
    amount: Number(c.amount),
    daysUntilExpiry: Math.ceil(
      (c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    ),
    status: c.status,
  }));
}

export async function getRecentActivity(companyId: string) {
  const logs = await prisma.auditLog.findMany({
    where: { companyId },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    userName: log.user?.name ?? null,
    createdAt: log.createdAt,
    description: buildDescription(log.action, log.entityType, log.entityId, log.user?.name),
  }));
}

function buildDescription(
  action: string,
  entityType: string,
  entityId: string,
  userName?: string,
): string {
  const mappings: Record<string, Record<string, string>> = {
    LOGIN: {
      _default: `Usuário ${userName ?? "desconhecido"} fez login`,
    },
    LOGOUT: {
      _default: `Usuário ${userName ?? "desconhecido"} fez logout`,
    },
    CREATE: {
      Service: `OS #${entityId} foi criada`,
      Customer: `Cliente foi criado`,
      Contract: `Contrato foi criado`,
      Employee: `Funcionário foi criado`,
      Equipment: `Equipamento foi criado`,
      _default: `${entityType} foi criado`,
    },
    UPDATE: {
      Customer: `Cliente foi atualizado`,
      Contract: `Contrato foi atualizado`,
      Employee: `Funcionário foi atualizado`,
      Equipment: `Equipamento foi atualizado`,
      Company: `Empresa foi atualizada`,
      _default: `${entityType} foi atualizado`,
    },
    DELETE: {
      _default: `${entityType} foi removido`,
    },
    START: {
      Service: `OS #${entityId} foi iniciada`,
      _default: `${entityType} foi iniciado`,
    },
    COMPLETE: {
      Service: `OS #${entityId} foi concluída`,
      _default: `${entityType} foi concluído`,
    },
    CONFIRM: {
      Service: `OS #${entityId} foi confirmada`,
      _default: `${entityType} foi confirmado`,
    },
    CANCEL: {
      Service: `OS #${entityId} foi cancelada`,
      _default: `${entityType} foi cancelado`,
    },
    RESCHEDULE: {
      Service: `OS #${entityId} foi reagendada`,
      _default: `${entityType} foi reagendado`,
    },
    CHANGE_PASSWORD: {
      _default: `${userName ?? "Usuário"} alterou a senha`,
    },
    RESET_PASSWORD: {
      _default: `Senha foi redefinida`,
    },
    CONSENT: {
      _default: `Consentimento de dados foi registrado`,
    },
    UPLOAD_LOGO: {
      _default: `Logo da empresa foi atualizado`,
    },
    ACTIVATE: {
      _default: `${entityType} foi ativado`,
    },
    DEACTIVATE: {
      _default: `${entityType} foi desativado`,
    },
  };

  const actionMap = mappings[action];
  if (!actionMap) return `${action} em ${entityType}`;

  const entitySpecific = actionMap[entityType] ?? actionMap._default;
  return entitySpecific ?? `${action} em ${entityType}`;
}
