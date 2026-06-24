import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";

const PLAN_LIMITS: Record<string, { customers: number; contracts: number; employees: number; monthlyServices: number }> = {
  FREE: { customers: 10, contracts: 10, employees: 3, monthlyServices: 30 },
  STARTER: { customers: 100, contracts: 100, employees: 20, monthlyServices: 200 },
  PRO: { customers: 500, contracts: 500, employees: 50, monthlyServices: 1000 },
  BUSINESS: { customers: Infinity, contracts: Infinity, employees: Infinity, monthlyServices: Infinity },
};

async function getCompanyPlan(companyId: string): Promise<{ plan: string }> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  });
  if (!company) throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");
  return company;
}

export async function checkCustomerLimit(companyId: string): Promise<void> {
  const { plan } = await getCompanyPlan(companyId);
  const limit = PLAN_LIMITS[plan]?.customers ?? 10;
  if (limit === Infinity) return;

  const count = await prisma.customer.count({
    where: { companyId, deletedAt: null },
  });

  if (count >= limit) {
    throw new AppError(
      `Limite de ${limit} clientes atingido para o plano ${plan}. Faça upgrade para cadastrar mais.`,
      403,
      "PLAN_LIMIT_REACHED",
    );
  }
}

export async function checkContractLimit(companyId: string): Promise<void> {
  const { plan } = await getCompanyPlan(companyId);
  const limit = PLAN_LIMITS[plan]?.contracts ?? 10;
  if (limit === Infinity) return;

  const count = await prisma.contract.count({
    where: { companyId, deletedAt: null, status: "ACTIVE" },
  });

  if (count >= limit) {
    throw new AppError(
      `Limite de ${limit} contratos ativos atingido para o plano ${plan}. Faça upgrade para cadastrar mais.`,
      403,
      "PLAN_LIMIT_REACHED",
    );
  }
}

export async function checkEmployeeLimit(companyId: string): Promise<void> {
  const { plan } = await getCompanyPlan(companyId);
  const limit = PLAN_LIMITS[plan]?.employees ?? 3;
  if (limit === Infinity) return;

  const count = await prisma.employee.count({
    where: { companyId, deletedAt: null, isActive: true },
  });

  if (count >= limit) {
    throw new AppError(
      `Limite de ${limit} funcionários ativos atingido para o plano ${plan}. Faça upgrade para cadastrar mais.`,
      403,
      "PLAN_LIMIT_REACHED",
    );
  }
}

export async function checkMonthlyServiceLimit(companyId: string): Promise<void> {
  const { plan } = await getCompanyPlan(companyId);
  const limit = PLAN_LIMITS[plan]?.monthlyServices ?? 30;
  if (limit === Infinity) return;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = await prisma.service.count({
    where: { companyId, deletedAt: null, createdAt: { gte: monthStart } },
  });

  if (count >= limit) {
    throw new AppError(
      `Limite de ${limit} ordens de serviço mensais atingido para o plano ${plan}. Faça upgrade para continuar.`,
      403,
      "PLAN_LIMIT_REACHED",
    );
  }
}
