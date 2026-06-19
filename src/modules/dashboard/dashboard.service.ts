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
  ] = await Promise.all([
    prisma.customer.count({ where: { companyId, deletedAt: null, isActive: true } }),
    prisma.contract.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.service.count({ where: { companyId, deletedAt: null, scheduledAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.contract.count({ where: { companyId, deletedAt: null, status: "ACTIVE", endDate: { gte: now, lte: addMonths(now, 1) } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, status: { in: ["SCHEDULED", "IN_PROGRESS"] }, scheduledAt: { lt: now } } }),
    prisma.employee.count({ where: { companyId, deletedAt: null, isActive: true } }),
    prisma.contract.aggregate({ where: { companyId, deletedAt: null, status: "ACTIVE" }, _sum: { amount: true } }),
    prisma.service.count({ where: { companyId, deletedAt: null, scheduledAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, status: "COMPLETED", completedDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, status: "COMPLETED", confirmedAt: { not: null }, completedDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.$queryRaw<Array<{ avg: number | null }>>`
      SELECT AVG(
        EXTRACT(EPOCH FROM (s.completed_date - s.scheduled_at)) / 3600
      ) as avg
      FROM services s
      WHERE s.company_id = ${companyId}
        AND s.deleted_at IS NULL
        AND s.status = 'COMPLETED'
        AND s.completed_date IS NOT NULL
        AND s.scheduled_at IS NOT NULL
    `,
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
  };
}

export async function getUpcomingServices(companyId: string, start?: string, end?: string) {
  const now = new Date();
  const startDate = start ? new Date(start) : now;
  const endDate = end ? new Date(end) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const services = await prisma.service.findMany({
    where: { companyId, deletedAt: null, scheduledAt: { gte: startDate, lte: endDate } },
    include: {
      customer: { select: { id: true, name: true, address: true } },
      employee: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  return services.map((s) => ({
    id: s.id,
    customerName: s.customer.name,
    customerAddress: (s.customer.address as Record<string, unknown> | null)?.city as string | null ?? "",
    employeeName: s.employee?.name ?? null,
    employeeId: s.employee?.id ?? null,
    scheduledDate: s.scheduledAt.toISOString(),
    serviceType: s.serviceType ?? "MAINTENANCE",
    status: s.status,
  }));
}

export async function getExpiringContracts(companyId: string) {
  const now = new Date();
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

export async function getRecentActivity(companyId: string) {
  const logs = await prisma.auditLog.findMany({
    where: { companyId },
    include: { user: { select: { name: true } } },
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
    const completedToday = todayServices.filter((s) => s.status === "COMPLETED").length;
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
      AND s.status = 'COMPLETED'
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

function buildDescription(action: string, entityType: string, entityId: string, userName?: string): string {
  const mappings: Record<string, Record<string, string>> = {
    LOGIN: { _default: `Usuário ${userName ?? "desconhecido"} fez login` },
    LOGOUT: { _default: `Usuário ${userName ?? "desconhecido"} fez logout` },
    CREATE: {
      Service: `OS #${entityId} foi criada`,
      Customer: "Cliente foi criado",
      Contract: "Contrato foi criado",
      Employee: "Funcionário foi criado",
      Equipment: "Equipamento foi criado",
      _default: `${entityType} foi criado`,
    },
    UPDATE: {
      Customer: "Cliente foi atualizado",
      Contract: "Contrato foi atualizado",
      Employee: "Funcionário foi atualizado",
      Equipment: "Equipamento foi atualizado",
      Company: "Empresa foi atualizada",
      _default: `${entityType} foi atualizado`,
    },
    DELETE: { _default: `${entityType} foi removido` },
    START: { Service: `OS #${entityId} foi iniciada`, _default: `${entityType} foi iniciado` },
    COMPLETE: { Service: `OS #${entityId} foi concluída`, _default: `${entityType} foi concluído` },
    CONFIRM: { Service: `OS #${entityId} foi confirmada`, _default: `${entityType} foi confirmado` },
    CANCEL: { Service: `OS #${entityId} foi cancelada`, _default: `${entityType} foi cancelado` },
    RESCHEDULE: { Service: `OS #${entityId} foi reagendada`, _default: `${entityType} foi reagendado` },
    CHANGE_PASSWORD: { _default: `${userName ?? "Usuário"} alterou a senha` },
    RESET_PASSWORD: { _default: "Senha foi redefinida" },
    CONSENT: { _default: "Consentimento de dados foi registrado" },
    UPLOAD_LOGO: { _default: "Logo da empresa foi atualizado" },
    ACTIVATE: { _default: `${entityType} foi ativado` },
    DEACTIVATE: { _default: `${entityType} foi desativado` },
  };

  const actionMap = mappings[action];
  if (!actionMap) return `${action} em ${entityType}`;
  return actionMap[entityType] ?? actionMap._default ?? `${action} em ${entityType}`;
}
