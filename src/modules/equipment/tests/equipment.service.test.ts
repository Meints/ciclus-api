import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");

import { prisma } from "../../../config/prisma";
import * as equipmentService from "../equipment.service";

const prismaMock = prisma as any;

const mockEquipment = {
  id: "eq-1", customerId: "cust-1", companyId: "co-1",
  type: "Ar-condicionado", brand: "Samsung", model: "WindFree",
  capacity: "12000 BTU", serialNumber: "SN123", location: "Sala 1",
  installedAt: new Date("2023-01-01"), notes: null,
  isActive: true, deletedAt: null,
  createdAt: new Date(), updatedAt: new Date(),
};

const mockCustomer = { id: "cust-1" };

beforeEach(() => {
  mockReset(prismaMock);
});

describe("equipment.service", () => {
  describe("list", () => {
    it("retorna equipamentos de um cliente", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomer);
      prismaMock.equipment.findMany.mockResolvedValue([mockEquipment]);

      const result = await equipmentService.list("co-1", "cust-1", {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("eq-1");
    });

    it("lança 404 se cliente não encontrado", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(null);

      await expect(equipmentService.list("co-1", "x", {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("create", () => {
    it("cria equipamento com sucesso", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomer);
      prismaMock.equipment.create.mockResolvedValue(mockEquipment);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await equipmentService.create("co-1", "cust-1", {
        type: "Ar-condicionado", brand: "Samsung", model: "WindFree",
      }, "user-1");

      expect(result.type).toBe("Ar-condicionado");
    });
  });

  describe("toggle", () => {
    it("desativa equipamento ativo", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomer);
      prismaMock.equipment.findFirst.mockResolvedValue(mockEquipment);
      prismaMock.equipment.update.mockResolvedValue({ ...mockEquipment, isActive: false });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await equipmentService.toggle("co-1", "cust-1", "eq-1", "user-1");

      expect(prismaMock.equipment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }),
      );
    });

    it("lança 404 se equipamento não encontrado", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomer);
      prismaMock.equipment.findFirst.mockResolvedValue(null);

      await expect(equipmentService.toggle("co-1", "cust-1", "x", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
