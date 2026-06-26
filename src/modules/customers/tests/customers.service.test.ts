import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");
vi.mock("../../../modules/company/plan-limits", () => ({
  checkCustomerLimit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../utils/document", () => ({
  validateDocument: vi.fn().mockReturnValue(true),
  formatCpf: vi.fn((d: string) => d),
  formatCnpj: vi.fn((d: string) => d),
}));

import { prisma } from "../../../config/prisma";
import * as customersService from "../customers.service";

const prismaMock = prisma as any;

const mockCustomer = {
  id: "cust-1", companyId: "co-1", name: "Empresa XYZ", fantasyName: null,
  documentType: "CNPJ", document: "12345678000199", email: "xpto@xpto.com",
  phone: "11999999999", notes: null, address: null, isActive: true,
  deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
  _count: { contracts: 2 },
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe("customers.service", () => {
  describe("list", () => {
    it("retorna lista paginada de clientes", async () => {
      prismaMock.customer.findMany.mockResolvedValue([mockCustomer]);
      prismaMock.customer.count.mockResolvedValue(1);

      const result = await customersService.list("co-1", {}, {}, "OWNER");

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it("aplica filtro de busca", async () => {
      prismaMock.customer.findMany.mockResolvedValue([]);
      prismaMock.customer.count.mockResolvedValue(0);

      await customersService.list("co-1", { search: "Empresa" }, {}, "ADMIN");

      expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe("getById", () => {
    it("retorna cliente existente", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await customersService.getById("co-1", "cust-1", "OWNER");

      expect(result.id).toBe("cust-1");
    });

    it("lança 404 se cliente não encontrado", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(null);

      await expect(customersService.getById("co-1", "x", "OWNER")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("create", () => {
    it("cria cliente com sucesso", async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);
      prismaMock.customer.create.mockResolvedValue(mockCustomer);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await customersService.create("co-1", {
        name: "Empresa XYZ",
        documentType: "CNPJ",
        document: "12345678000199",
      });

      expect(prismaMock.customer.create).toHaveBeenCalled();
    });

    it("lança erro se documento duplicado", async () => {
      prismaMock.customer.findUnique.mockResolvedValue(mockCustomer);

      await expect(
        customersService.create("co-1", { name: "Outro", documentType: "CNPJ", document: "12345678000199" }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("toggle", () => {
    it("alterna status ativo/inativo", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomer);
      prismaMock.customer.update.mockResolvedValue({ ...mockCustomer, isActive: false });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await customersService.toggle("co-1", "cust-1", "user-1");

      expect(prismaMock.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });

    it("lança 404 se cliente não encontrado", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(null);

      await expect(customersService.toggle("co-1", "x", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("remove", () => {
    it("faz soft delete do cliente sem contratos ativos", async () => {
      prismaMock.customer.findFirst.mockResolvedValue({ ...mockCustomer, contracts: [] });
      prismaMock.customer.update.mockResolvedValue({ ...mockCustomer, deletedAt: new Date(), isActive: false });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await customersService.remove("co-1", "cust-1");

      expect(prismaMock.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }) }),
      );
    });

    it("lança 409 se cliente tem contratos ativos", async () => {
      prismaMock.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        contracts: [{ id: "c-1", status: "ACTIVE" }],
      });

      await expect(customersService.remove("co-1", "cust-1")).rejects.toMatchObject({
        statusCode: 409,
        code: "HAS_ACTIVE_CONTRACTS",
      });
    });
  });
});
