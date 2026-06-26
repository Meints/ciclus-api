import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");
vi.mock("../../../integrations/storage/storage.service", () => ({
  uploadFile: vi.fn().mockResolvedValue("https://storage.example.com/logo.png"),
  validateImageMime: vi.fn().mockReturnValue("png"),
  ensureLogosBucket: vi.fn().mockResolvedValue(undefined),
  LOGOS_BUCKET: "logos",
}));

import { prisma } from "../../../config/prisma";
import * as companyService from "../company.service";

const prismaMock = prisma as any;

const mockCompany = {
  id: "co-1", name: "Test Co", niche: "AIR_CONDITIONING", plan: "STARTER",
  isActive: true, logoUrl: null, address: null, document: null,
  createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe("company.service", () => {
  describe("getCompany", () => {
    it("retorna dados da empresa para OWNER", async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);

      const result = await companyService.getCompany("co-1", "OWNER");

      expect(result.id).toBe("co-1");
      expect(result.name).toBe("Test Co");
    });

    it("lança 404 se empresa não encontrada", async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(companyService.getCompany("x", "OWNER")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("mascara documento para ADMIN", async () => {
      prismaMock.company.findUnique.mockResolvedValue({ ...mockCompany, document: "12345678901" });

      const result = await companyService.getCompany("co-1", "ADMIN");

      expect(result.document).not.toBe("12345678901");
    });
  });

  describe("updateCompany", () => {
    it("atualiza nome da empresa", async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.company.update.mockResolvedValue({ ...mockCompany, name: "Nova Co" });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await companyService.updateCompany("co-1", { name: "Nova Co" }, "user-1");

      expect(prismaMock.company.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: "Nova Co" }) }),
      );
    });

    it("ignora campos não permitidos", async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);

      const result = await companyService.updateCompany("co-1", { isActive: false } as any, "u");

      expect(prismaMock.company.update).not.toHaveBeenCalled();
    });

    it("lança 404 se empresa não encontrada", async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(companyService.updateCompany("x", { name: "y" }, "u")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("getUsage", () => {
    it("retorna contagens de uso dentro dos limites do plano", async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.customer.count.mockResolvedValue(5);
      prismaMock.contract.count.mockResolvedValue(3);
      prismaMock.service.count.mockResolvedValue(10);

      const result = await companyService.getUsage("co-1");

      expect(result).toHaveProperty("activeCustomers", 5);
      expect(result).toHaveProperty("activeContracts", 3);
      expect(result).toHaveProperty("plan", "STARTER");
      expect(result.limits).toHaveProperty("customers", 100);
    });
  });
});
