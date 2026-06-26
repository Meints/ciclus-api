import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");
vi.mock("bcrypt");

import { prisma } from "../../../config/prisma";
import bcrypt from "bcrypt";
import * as adminService from "../admin.service";

const prismaMock = prisma as any;

const mockCompany = {
  id: "co-1", name: "Test Co", niche: "AIR_CONDITIONING", plan: "FREE",
  isActive: true, createdAt: new Date(), updatedAt: new Date(),
};
const mockOwner = {
  id: "user-1", companyId: "co-1", name: "Owner", email: "owner@co.com",
  role: "OWNER", isActive: true, deletedAt: null, createdAt: new Date(),
};
const mockSuperadmin = {
  id: "sa-1", companyId: "co-sa", role: "SUPERADMIN", deletedAt: null,
};

beforeEach(() => {
  mockReset(prismaMock);
  vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
});

describe("admin.service", () => {
  describe("getOverview", () => {
    it("retorna métricas globais da plataforma", async () => {
      prismaMock.company.count.mockResolvedValue(10);
      prismaMock.contract.findMany.mockResolvedValue([
        { amount: 1200, frequency: "MONTHLY" },
        { amount: 3600, frequency: "QUARTERLY" },
      ]);
      prismaMock.service.groupBy.mockResolvedValue([]);

      const result = await adminService.getOverview();

      expect(result.totalCompanies).toBe(10);
      expect(result.globalMRR).toBeCloseTo(1200 + 3600 / 3, 0);
    });
  });

  describe("createCompany", () => {
    it("cria empresa e usuário OWNER com senha temporária", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.company.create.mockResolvedValue(mockCompany);
      prismaMock.user.create.mockResolvedValue(mockOwner);

      const result = await adminService.createCompany({
        companyName: "Test Co",
        ownerName: "Owner",
        ownerEmail: "owner@co.com",
        niche: "AIR_CONDITIONING",
        plan: "FREE",
      });

      expect(result.company.name).toBe("Test Co");
      expect(result.owner.email).toBe("owner@co.com");
      expect(result.tempPassword).toBeDefined();
      expect(result.tempPassword.length).toBeGreaterThan(0);
    });

    it("lança 409 se e-mail já cadastrado", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockOwner);

      await expect(
        adminService.createCompany({
          companyName: "Test Co", ownerName: "Owner", ownerEmail: "owner@co.com",
        }),
      ).rejects.toMatchObject({ statusCode: 409, code: "EMAIL_ALREADY_EXISTS" });
    });
  });

  describe("toggleCompanyStatus", () => {
    it("suspende empresa ativa", async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.company.update.mockResolvedValue({ ...mockCompany, isActive: false });

      const result = await adminService.toggleCompanyStatus("co-1");

      expect(result.isActive).toBe(false);
      expect(prismaMock.company.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });

    it("ativa empresa suspensa", async () => {
      prismaMock.company.findUnique.mockResolvedValue({ ...mockCompany, isActive: false });
      prismaMock.company.update.mockResolvedValue(mockCompany);

      const result = await adminService.toggleCompanyStatus("co-1");

      expect(result.isActive).toBe(true);
    });

    it("lança 404 se empresa não encontrada", async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(adminService.toggleCompanyStatus("x")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("updateCompanyPlan", () => {
    it("atualiza plano com sucesso", async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.company.update.mockResolvedValue({ ...mockCompany, plan: "PRO" });

      const result = await adminService.updateCompanyPlan("co-1", "PRO");

      expect(prismaMock.company.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { plan: "PRO" } }),
      );
    });

    it("lança erro com plano inválido", async () => {
      await expect(adminService.updateCompanyPlan("co-1", "INVALID")).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_PLAN",
      });
    });
  });

  describe("listCompanyUsers", () => {
    it("retorna usuários da empresa", async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.user.findMany.mockResolvedValue([mockOwner]);

      const result = await adminService.listCompanyUsers("co-1");

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("owner@co.com");
    });

    it("lança 404 se empresa não encontrada", async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(adminService.listCompanyUsers("x")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("removeCompanyUser", () => {
    it("faz soft delete do usuário", async () => {
      const adminUser = { ...mockOwner, role: "ADMIN", id: "user-2" };
      prismaMock.user.findFirst.mockResolvedValue(adminUser);
      prismaMock.user.update.mockResolvedValue({ ...adminUser, deletedAt: new Date() });

      await adminService.removeCompanyUser("co-1", "user-2");

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { deletedAt: expect.any(Date) } }),
      );
    });

    it("não permite remover OWNER", async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockOwner);

      await expect(adminService.removeCompanyUser("co-1", "user-1")).rejects.toMatchObject({
        statusCode: 400,
        code: "CANNOT_REMOVE_OWNER",
      });
    });
  });

  describe("updateCompanyUserRole", () => {
    it("altera role para ADMIN com sucesso", async () => {
      const techUser = { ...mockOwner, role: "TECHNICIAN", id: "user-2" };
      prismaMock.user.findFirst.mockResolvedValue(techUser);
      prismaMock.user.update.mockResolvedValue({ ...techUser, role: "ADMIN" });

      const result = await adminService.updateCompanyUserRole("co-1", "user-2", "ADMIN");

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: "ADMIN" } }),
      );
    });

    it("não permite alterar role de OWNER", async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockOwner);

      await expect(
        adminService.updateCompanyUserRole("co-1", "user-1", "ADMIN"),
      ).rejects.toMatchObject({ statusCode: 400, code: "CANNOT_CHANGE_OWNER_ROLE" });
    });

    it("lança erro com role inválido", async () => {
      await expect(
        adminService.updateCompanyUserRole("co-1", "user-2", "SUPERADMIN"),
      ).rejects.toMatchObject({ statusCode: 400, code: "INVALID_ROLE" });
    });
  });

  describe("getSuperadminById", () => {
    it("retorna superadmin existente", async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockSuperadmin);

      const result = await adminService.getSuperadminById("sa-1");

      expect(result.id).toBe("sa-1");
    });

    it("lança 404 se não encontrado", async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(adminService.getSuperadminById("x")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("generateImpersonationToken", () => {
    it("retorna dados do OWNER da empresa", async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockOwner);

      const result = await adminService.generateImpersonationToken("co-1");

      expect(result.userId).toBe("user-1");
      expect(result.role).toBe("OWNER");
    });

    it("lança 404 se empresa não tem OWNER", async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(adminService.generateImpersonationToken("co-1")).rejects.toMatchObject({
        statusCode: 404,
        code: "NO_OWNER",
      });
    });
  });
});
