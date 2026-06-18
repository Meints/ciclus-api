import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { maskDocument } from "../../lib/mask";

export async function getCompany(companyId: string, requestingUserRole: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");
  }

  if (requestingUserRole === "ADMIN" && company.document) {
    const documentType = company.document.length <= 11 ? "CPF" : "CNPJ";
    return {
      ...company,
      document: maskDocument(company.document, documentType as "CPF" | "CNPJ"),
    };
  }

  return company;
}

export async function updateCompany(
  companyId: string,
  data: Record<string, unknown>,
  userId: string,
) {
  const oldCompany = await prisma.company.findUnique({ where: { id: companyId } });
  if (!oldCompany) {
    throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");
  }

  const { document: _doc, ...updateData } = data as { document?: string; [key: string]: unknown };

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: updateData,
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Company",
    entityId: companyId,
    action: "UPDATE",
    oldData: oldCompany as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
  });

  return updated;
}

export async function uploadLogo(
  companyId: string,
  fileBuffer: Buffer,
  mimeType: string,
  userId: string,
) {
  const magicBytes: Record<string, string[]> = {
    "FFD8FF": ["image/jpeg"],
    "89504E47": ["image/png"],
    "52494646": ["image/webp"],
  };

  const hexSignature = fileBuffer.subarray(0, 4).toString("hex").toUpperCase();
  let detectedMime: string | null = null;

  for (const [sig] of Object.entries(magicBytes)) {
    if (hexSignature.startsWith(sig)) {
      detectedMime = mimeType;
      break;
    }
  }

  if (!detectedMime) {
    throw new AppError("Formato de imagem não suportado", 400, "INVALID_IMAGE");
  }

  const ext = mimeType.split("/")[1];
  const logoUrl = `/uploads/logos/${companyId}.${ext}`;

  await prisma.company.update({
    where: { id: companyId },
    data: { logoUrl },
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Company",
    entityId: companyId,
    action: "UPLOAD_LOGO",
  });

  return { logoUrl };
}

export async function getUsage(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeCustomers, activeContracts, servicesThisMonth] = await Promise.all([
    prisma.customer.count({
      where: { companyId, isActive: true, deletedAt: null },
    }),
    prisma.contract.count({
      where: { companyId, status: "ACTIVE", deletedAt: null },
    }),
    prisma.service.count({
      where: {
        companyId,
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
    }),
  ]);

  const planLimits: Record<string, number> = {
    FREE: 10,
    STARTER: 100,
    PRO: 500,
    BUSINESS: Infinity,
  };

  return {
    activeCustomers,
    activeContracts,
    servicesThisMonth,
    plan: company.plan,
    limits: {
      customers: planLimits[company.plan] ?? 10,
      contracts: planLimits[company.plan] ?? 10,
    },
  };
}
