import { prisma } from "../../config/prisma";
import { startOfMonth, endOfMonth, addMonths, startOfDay, endOfDay } from "../../utils/date";

const FREQ_TO_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
  SEMIANNUAL: 6,
  YEARLY: 12,
};

function normalizeToMonthly(amount: number, frequency: string): number {
  const months = FREQ_TO_MONTHS[frequency] ?? 1;
  return amount / months;
}

export async function getSummary(companyId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    activeCustomers,
    activeContracts,
    servicesThisMonth,
    aboutToExpireContracts,
    delayedServices,
    totalTechnicians,
    totalContractValue,
    servicesScheduledToday,
    completedServices,
    confirmedServices,
    avgHoursRaw,
    paidThisMonthAgg,
    pendingPaymentAgg,
    totalServices,
  ] = await Promise.all([
    prisma.customer.count({ where: { companyId, deletedAt: null, isActive: true } }),
    prisma.contract.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.service.count({ where: { companyId, deletedAt: null, scheduledAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.contract.count({ where: { companyId, deletedAt: null, status: "ACTIVE", endDate: { gte: now, lte: addMonths(now, 1) } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, status: { in: ["SCHEDULED", "IN_PROGRESS"] }, scheduledAt: { lt: now } } }),
    prisma.employee.count({ where: { companyId, deletedAt: null, isActive: true } }),
    prisma.contract.aggregate({ where: { companyId, deletedAt: null, status: "ACTIVE" }, _sum: { amount: true } }),
    prisma.service.count({ where: { companyId, deletedAt: null, scheduledAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, status: { in: ["COMPLETED", "CONFIRMED"] }, completedDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, confirmedAt: { not: null }, completedDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.$queryRaw<Array<{ avg: number | null }>>`
      SELECT AVG(s.duration_minutes) / 60.0 as avg
      FROM services s
      WHERE s.company_id = ${companyId}
        AND s.deleted_at IS NULL
        AND s.status IN ('COMPLETED', 'CONFIRMED')
        AND s.duration_minutes IS NOT NULL
        AND s.duration_minutes > 0
    `,
    prisma.service.aggregate({
      where: { companyId, deletedAt: null, isPaid: true, status: { in: ["COMPLETED", "CONFIRMED"] }, completedDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.service.aggregate({
      where: { companyId, deletedAt: null, isPaid: false, status: { in: ["COMPLETED", "CONFIRMED"] } },
      _sum: { amount: true },
    }),
    prisma.service.count({ where: { companyId, deletedAt: null } }),
  ]);

  const activeContractsList = await prisma.contract.findMany({
    where: { companyId, deletedAt: null, status: "ACTIVE" },
    select: { amount: true, frequency: true },
  });

  const monthlyRecurringRevenue = activeContractsList.reduce(
    (sum, c) => sum + normalizeToMonthly(Number(c.amount), c.frequency),
    0,
  );

  const techniciansWithServicesToday = await prisma.service.groupBy({
    by: ["employeeId"],
    where: {
      companyId,
      deletedAt: null,
      employeeId: { not: null },
      scheduledAt: { gte: todayStart, lte: todayEnd },
    },
  });

  const techniciansBusyToday = techniciansWithServicesToday.length;
  const confirmationRate = completedServices > 0 ? (confirmedServices / completedServices) * 100 : 0;
  const averageCompletionHours = avgHoursRaw[0]?.avg ? Number(Number(avgHoursRaw[0].avg).toFixed(1)) : 0;

  return {
    activeCustomers,
    activeContracts,
    servicesThisMonth,
    contractsExpiringIn30Days: aboutToExpireContracts,
    delayedServices,
    techniciansBusyToday,
    totalTechnicians,
    totalContractValue: totalContractValue._sum.amount ? Number(totalContractValue._sum.amount) : 0,
    monthlyRecurringRevenue,
    servicesCompletedThisMonth: completedServices,
    servicesScheduledToday,
    confirmationRate,
    averageCompletionHours,
    paidThisMonth: paidThisMonthAgg._sum.amount ? Number(paidThisMonthAgg._sum.amount) : 0,
    pendingPayment: pendingPaymentAgg._sum.amount ? Number(pendingPaymentAgg._sum.amount) : 0,
    totalServices,
  };
}

export async function getUpcomingServices(companyId: string, start?: string, end?: string, limit?: number) {
  const now = startOfDay(new Date());
  const startDate = start ? new Date(start) : now;
  const endDate = end ? new Date(end) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const services = limit
    ? await prisma.service.findMany({
        where: { companyId, deletedAt: null, scheduledAt: { gte: startDate, lte: endDate } },
        include: { customer: { select: { id: true, name: true, address: true } }, employee: { select: { id: true, name: true } } },
        orderBy: { scheduledAt: "asc" },
        take: limit,
      })
    : await prisma.service.findMany({
        where: { companyId, deletedAt: null, scheduledAt: { gte: startDate, lte: endDate } },
        include: { customer: { select: { id: true, name: true, address: true } }, employee: { select: { id: true, name: true } } },
        orderBy: { scheduledAt: "asc" },
      });

  return services.map((s) => ({
    id: s.id,
    customerName: s.customer.name,
    customerAddress: (s.customer.address as Record<string, unknown> | null)?.city as string | null ?? "",
    employeeName: s.employee?.name ?? null,
    employeeId: s.employee?.id ?? null,
    scheduledDate: s.scheduledAt.toISOString(),
    scheduledTime: `${String(s.scheduledAt.getUTCHours()).padStart(2, "0")}:${String(s.scheduledAt.getUTCMinutes()).padStart(2, "0")}`,
    estimatedDurationMinutes: s.estimatedDurationMinutes,
    serviceType: s.serviceType ?? "MAINTENANCE",
    status: s.status,
  }));
}

export async function getExpiringContracts(companyId: string) {
  const now = startOfDay(new Date());
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const contracts = await prisma.contract.findMany({
    where: { companyId, deletedAt: null, status: "ACTIVE", endDate: { gte: now, lte: thirtyDaysFromNow } },
    include: {
      customer: { select: { id: true, name: true } },
      services: {
        where: { deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        take: 1,
        select: { serviceType: true },
      },
    },
    orderBy: { endDate: "asc" },
  });

  return contracts.map((c) => {
    const lastService = c.services?.[0];
    return {
      id: c.id,
      customerId: c.customerId,
      customerName: c.customer.name,
      serviceType: lastService?.serviceType ?? "MAINTENANCE",
      expiresAt: c.endDate.toISOString(),
      daysRemaining: Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      value: Number(c.amount),
    };
  });
}

export async function getRecentActivity(
  companyId: string,
  page = 1,
  pageSize = 20,
  filters: { userId?: string; action?: string; entityType?: string; dateFrom?: string; dateTo?: string } = {},
) {
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { companyId };
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23, 59, 59, 999)) } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userName: log.user?.name ?? null,
      createdAt: log.createdAt,
      description: buildDescription(log.action, log.entityType, log.entityId, log.user?.name),
    })),
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getTechnicianStatus(companyId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const employees = await prisma.employee.findMany({
    where: { companyId, deletedAt: null },
    select: {
      id: true,
      name: true,
      isActive: true,
      services: {
        where: {
          deletedAt: null,
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
        select: {
          id: true,
          status: true,
          customer: { select: { name: true } },
        },
      },
    },
  });

  return employees.map((emp) => {
    const todayServices = emp.services;
    const servicesToday = todayServices.length;
    const completedToday = todayServices.filter((s) => s.status === "COMPLETED" || s.status === "CONFIRMED").length;
    const currentService = todayServices.find((s) => s.status === "IN_PROGRESS") ?? null;

    let status: "FREE" | "BUSY" | "OFFLINE";
    if (!emp.isActive) {
      status = "OFFLINE";
    } else if (currentService) {
      status = "BUSY";
    } else {
      status = "FREE";
    }

    return {
      id: emp.id,
      name: emp.name,
      servicesToday,
      completedToday,
      currentServiceId: currentService?.id ?? null,
      currentServiceCustomer: currentService?.customer.name ?? null,
      status,
    };
  });
}

export async function getMonthlyRevenue(companyId: string) {
  const now = new Date();

  const rows = await prisma.$queryRaw<Array<{ month: string; value: number; count: bigint }>>`
    SELECT
      TO_CHAR(DATE_TRUNC('month', s.completed_date), 'YYYY-MM') as month,
      COALESCE(SUM(s.amount), 0) as value,
      COUNT(*)::int as count
    FROM services s
    WHERE s.company_id = ${companyId}
      AND s.deleted_at IS NULL
      AND s.status IN ('COMPLETED', 'CONFIRMED')
      AND s.completed_date >= ${startOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1))}
    GROUP BY DATE_TRUNC('month', s.completed_date)
    ORDER BY month ASC
  `;

  const rowsByMonth = new Map(rows.map((r) => [r.month, { value: Number(r.value), services: Number(r.count) }]));

  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const data = rowsByMonth.get(monthKey) ?? { value: 0, services: 0 };
    result.push({ month: monthKey, value: data.value, services: data.services });
  }

  return result;
}

const ENTITY_LABELS: Record<string, string> = {
  Service: "OS",
  Customer: "Cliente",
  Contract: "Contrato",
  Employee: "Funcionário",
  Equipment: "Equipamento",
  Company: "Empresa",
  User: "Usuário",
};

function entityLabel(entityType: string) {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function buildDescription(action: string, entityType: string, entityId: string, userName?: string): string {
  const entity = entityLabel(entityType);
  const user = userName ?? "Usuário";

  const mappings: Record<string, Record<string, string>> = {
    LOGIN: { _default: `${user} fez login` },
    LOGOUT: { _default: `${user} fez logout` },
    CREATE: {
      Service: `OS foi criada`,
      Customer: "Cliente foi criado",
      Contract: "Contrato foi criado",
      Employee: "Funcionário foi criado",
      Equipment: "Equipamento foi criado",
      _default: `${entity} foi criado`,
    },
    UPDATE: {
      Customer: "Cliente foi atualizado",
      Contract: "Contrato foi atualizado",
      Employee: "Funcionário foi atualizado",
      Equipment: "Equipamento foi atualizado",
      Company: "Empresa foi atualizada",
      User: "Usuário foi atualizado",
      _default: `${entity} foi atualizado`,
    },
    DELETE: {
      Service: "OS foi removida",
      Customer: "Cliente foi removido",
      Contract: "Contrato foi removido",
      Employee: "Funcionário foi removido",
      Equipment: "Equipamento foi removido",
      _default: `${entity} foi removido`,
    },
    START: { Service: "OS foi iniciada", _default: `${entity} foi iniciado` },
    COMPLETE: { Service: "OS foi concluída", _default: `${entity} foi concluído` },
    CONFIRM: { Service: "OS foi confirmada pelo cliente", _default: `${entity} foi confirmado` },
    CANCEL: {
      Service: "OS foi cancelada",
      Contract: "Contrato foi cancelado",
      _default: `${entity} foi cancelado`,
    },
    RESCHEDULE: { Service: "OS foi reagendada", _default: `${entity} foi reagendado` },
    REOPEN: { Service: "OS foi reaberta", _default: `${entity} foi reaberto` },
    REVERT: { Service: "OS foi revertida para agendada", _default: `${entity} foi revertido` },
    TOGGLE_PAID: { Service: "Pagamento da OS foi atualizado", _default: `Pagamento de ${entity} foi atualizado` },
    PAUSE: { Contract: "Contrato foi pausado", _default: `${entity} foi pausado` },
    RESUME: { Contract: "Contrato foi retomado", _default: `${entity} foi retomado` },
    ACTIVATE: {
      Customer: "Cliente foi ativado",
      Employee: "Funcionário foi ativado",
      Equipment: "Equipamento foi ativado",
      User: "Usuário foi ativado",
      _default: `${entity} foi ativado`,
    },
    DEACTIVATE: {
      Customer: "Cliente foi desativado",
      Employee: "Funcionário foi desativado",
      Equipment: "Equipamento foi desativado",
      User: "Usuário foi desativado",
      _default: `${entity} foi desativado`,
    },
    CHANGE_PASSWORD: { _default: `${user} alterou a senha` },
    RESET_PASSWORD: { _default: "Senha foi redefinida" },
    CONSENT: { _default: "Consentimento de dados foi registrado" },
    UPLOAD_LOGO: { _default: "Logo da empresa foi atualizado" },
  };

  const actionMap = mappings[action];
  if (!actionMap) return `${entity} foi atualizado`;
  return actionMap[entityType] ?? actionMap._default ?? `${entity} foi atualizado`;
}
