import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");
vi.mock("../../../modules/company/plan-limits", () => ({
  checkEmployeeLimit: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "../../../config/prisma";
import * as employeesService from "../employees.service";

const prismaMock = prisma as any;

const mockEmployee = {
  id: "emp-1", companyId: "co-1", name: "João Técnico",
  email: "joao@co.com", phone: "11999999999",
  isActive: true, deletedAt: null,
  createdAt: new Date(), updatedAt: new Date(),
  _count: { services: 3 },
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe("employees.service", () => {
  describe("list", () => {
    it("retorna lista paginada de funcionários", async () => {
      prismaMock.employee.findMany.mockResolvedValue([mockEmployee]);
      prismaMock.employee.count.mockResolvedValue(1);

      const result = await employeesService.list("co-1", {}, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it("filtra por isActive=false", async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);
      prismaMock.employee.count.mockResolvedValue(0);

      await employeesService.list("co-1", { isActive: "false" }, {});

      expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });

  describe("getById", () => {
    it("retorna funcionário existente", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(mockEmployee);

      const result = await employeesService.getById("co-1", "emp-1");

      expect(result.id).toBe("emp-1");
    });

    it("lança 404 se não encontrado", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(null);

      await expect(employeesService.getById("co-1", "x")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("create", () => {
    it("cria funcionário com sucesso", async () => {
      prismaMock.employee.create.mockResolvedValue(mockEmployee);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await employeesService.create("co-1", { name: "João Técnico" });

      expect(result.name).toBe("João Técnico");
    });
  });

  describe("toggle", () => {
    it("desativa funcionário ativo", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(mockEmployee);
      prismaMock.employee.update.mockResolvedValue({ ...mockEmployee, isActive: false });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await employeesService.toggle("co-1", "emp-1", "user-1");

      expect(prismaMock.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it("lança 404 se não encontrado", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(null);

      await expect(employeesService.toggle("co-1", "x", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
