import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";

const FREQ_TO_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
  SEMIANNUAL: 6,
  YEARLY: 12,
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getOverview() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalCompanies, newThisMonth, totalUsers, activeContracts] = await Promise.all([
    prisma.company.count({ where: { isActive: true } }),
    prisma.company.count({ where: { isActive: true, createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.contract.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { amount: true, frequency: true },
    }),
  ]);

  const globalMRR = activeContracts.reduce((sum, c) => {
    const months = FREQ_TO_MONTHS[c.frequency] ?? 1;
    return sum + Number(c.amount) / months;
  }, 0);

  // Companies with zero services in last 30 days (at risk)
  const companiesWithRecentActivity = await prisma.service.groupBy({
    by: ["companyId"],
    where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
  });
  const activeCompanyIds = companiesWithRecentActivity.map((c) => c.companyId);
  const atRiskCount = await prisma.company.count({
    where: {
      isActive: true,
      id: { notIn: activeCompanyIds },
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  return { totalCompanies, newThisMonth, totalUsers, globalMRR, atRiskCount };
}

export async function listCompanies(filters: {
  plan?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { isActive: true };
  if (filters.plan) where.plan = filters.plan;
  if (filters.search) where.name = { contains: filters.search, mode: "insensitive" };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            customers: { where: { deletedAt: null } },
            contracts: { where: { deletedAt: null, status: "ACTIVE" } },
            services: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const companyIds = companies.map((c) => c.id);
  const servicesThisMonth = await prisma.service.groupBy({
    by: ["companyId"],
    where: { companyId: { in: companyIds }, deletedAt: null, createdAt: { gte: monthStart } },
    _count: true,
  });
  const servicesByCompany = new Map(servicesThisMonth.map((s) => [s.companyId, s._count]));

  return {
    data: companies.map((c) => ({
      id: c.id,
      name: c.name,
      niche: c.niche,
      plan: c.plan,
      createdAt: c.createdAt.toISOString(),
      users: c._count.users,
      customers: c._count.customers,
      activeContracts: c._count.contracts,
      totalServices: c._count.services,
      servicesThisMonth: servicesByCompany.get(c.id) ?? 0,
    })),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getCompanyDetail(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      users: {
        where: { deletedAt: null },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          customers: { where: { deletedAt: null } },
          contracts: { where: { deletedAt: null, status: "ACTIVE" } },
          services: { where: { deletedAt: null } },
          employees: { where: { deletedAt: null } },
        },
      },
    },
  });
  if (!company) throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const [servicesThisMonth, completedThisMonth, contractAggregate] = await Promise.all([
    prisma.service.count({ where: { companyId, deletedAt: null, createdAt: { gte: monthStart } } }),
    prisma.service.count({
      where: {
        companyId,
        deletedAt: null,
        status: { in: ["COMPLETED", "CONFIRMED"] },
        completedDate: { gte: monthStart },
      },
    }),
    prisma.contract.findMany({
      where: { companyId, deletedAt: null, status: "ACTIVE" },
      select: { amount: true, frequency: true },
    }),
  ]);

  const mrr = contractAggregate.reduce(
    (sum, c) => sum + Number(c.amount) / (FREQ_TO_MONTHS[c.frequency] ?? 1),
    0,
  );

  // Last 6 months of service counts
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyServices = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
    SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month, COUNT(*)::int as count
    FROM services
    WHERE company_id = ${companyId} AND deleted_at IS NULL
      AND created_at >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month ASC
  `;

  return {
    id: company.id,
    name: company.name,
    niche: company.niche,
    plan: company.plan,
    createdAt: company.createdAt.toISOString(),
    users: company.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
    stats: {
      customers: company._count.customers,
      activeContracts: company._count.contracts,
      employees: company._count.employees,
      totalServices: company._count.services,
      servicesThisMonth,
      completedThisMonth,
      mrr,
    },
    monthlyServices: monthlyServices.map((r) => ({ month: r.month, count: Number(r.count) })),
  };
}

export async function updateCompanyPlan(companyId: string, plan: string) {
  const validPlans = ["FREE", "STARTER", "PRO", "BUSINESS"];
  if (!validPlans.includes(plan)) throw new AppError("Plano inválido", 400, "INVALID_PLAN");

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");

  return prisma.company.update({ where: { id: companyId }, data: { plan } });
}

export async function getGlobalMRR() {
  const now = new Date();
  const result: Array<{ month: string; activeContracts: number; newCompanies: number }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [activeContracts, newCompanies] = await Promise.all([
      prisma.contract.count({
        where: { deletedAt: null, status: "ACTIVE", createdAt: { lte: monthEnd } },
      }),
      prisma.company.count({ where: { isActive: true, createdAt: { gte: d, lte: monthEnd } } }),
    ]);

    result.push({ month: monthKey, activeContracts, newCompanies });
  }
  return result;
}

export async function getAtRiskCompanies() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const companiesWithActivity = await prisma.service.groupBy({
    by: ["companyId"],
    where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
  });
  const activeIds = companiesWithActivity.map((c) => c.companyId);

  const companies = await prisma.company.findMany({
    where: { isActive: true, createdAt: { lt: thirtyDaysAgo }, id: { notIn: activeIds } },
    select: {
      id: true,
      name: true,
      niche: true,
      plan: true,
      createdAt: true,
      _count: { select: { services: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    niche: c.niche,
    plan: c.plan,
    createdAt: c.createdAt.toISOString(),
    totalServices: c._count.services,
  }));
}

export async function generateImpersonationToken(
  companyId: string,
): Promise<{ userId: string; companyId: string; role: string }> {
  const owner = await prisma.user.findFirst({
    where: { companyId, role: "OWNER", deletedAt: null },
    select: { id: true, companyId: true, role: true },
  });
  if (!owner) throw new AppError("Nenhum proprietário encontrado para esta empresa", 404, "NO_OWNER");
  return { userId: owner.id, companyId: owner.companyId, role: owner.role };
}

export async function getSuperadminById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "SUPERADMIN", deletedAt: null },
    select: { id: true, companyId: true },
  });
  if (!user) throw new AppError("Superadmin não encontrado", 404, "NOT_FOUND");
  return user;
}

export async function createCompany(data: {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  niche?: string;
  plan?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.ownerEmail } });
  if (existing) throw new AppError("E-mail já cadastrado", 409, "EMAIL_ALREADY_EXISTS");

  const tempPassword = crypto.randomBytes(8).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const company = await prisma.company.create({
    data: {
      name: data.companyName,
      niche: data.niche ?? null,
      plan: (data.plan as any) ?? "FREE",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: data.ownerName,
      email: data.ownerEmail,
      passwordHash,
      role: "OWNER",
      companyId: company.id,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return {
    company: {
      id: company.id,
      name: company.name,
      niche: company.niche,
      plan: company.plan,
      createdAt: company.createdAt.toISOString(),
    },
    owner: user,
    tempPassword,
  };
}

export async function toggleCompanyStatus(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: { isActive: !company.isActive },
    select: { id: true, name: true, isActive: true },
  });

  return updated;
}

export async function listCompanyUsers(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");

  const users = await prisma.user.findMany({
    where: { companyId, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return users;
}

export async function removeCompanyUser(companyId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId, deletedAt: null },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404, "NOT_FOUND");
  if (user.role === "OWNER") throw new AppError("Não é possível remover o proprietário da empresa", 400, "CANNOT_REMOVE_OWNER");

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
}

export async function updateCompanyUserRole(companyId: string, userId: string, role: string) {
  const validRoles = ["ADMIN", "TECHNICIAN"];
  if (!validRoles.includes(role)) throw new AppError("Role inválido. Use ADMIN ou TECHNICIAN", 400, "INVALID_ROLE");

  const user = await prisma.user.findFirst({
    where: { id: userId, companyId, deletedAt: null },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404, "NOT_FOUND");
  if (user.role === "OWNER") throw new AppError("Não é possível alterar o role do proprietário", 400, "CANNOT_CHANGE_OWNER_ROLE");

  return prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });
}
