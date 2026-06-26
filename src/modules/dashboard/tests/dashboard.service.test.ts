import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");

import { prisma } from "../../../config/prisma";
import * as dashboardService from "../dashboard.service";

const prismaMock = prisma as any;

beforeEach(() => {
  mockReset(prismaMock);
});

describe("dashboard.service", () => {
  describe("getSummary", () => {
    it("retorna todas as métricas do dashboard", async () => {
      prismaMock.customer.count.mockResolvedValue(20);
      prismaMock.contract.count.mockResolvedValue(5);
      prismaMock.service.count.mockResolvedValue(3);
      prismaMock.employee.count.mockResolvedValue(4);
      prismaMock.contract.aggregate.mockResolvedValue({ _sum: { amount: 15000 } });
      prismaMock.contract.findMany.mockResolvedValue([]);
      prismaMock.service.groupBy.mockResolvedValue([]);
      prismaMock.$queryRaw.mockResolvedValue([{ avg: null }]);

      const result = await dashboardService.getSummary("co-1");

      expect(result).toHaveProperty("activeContracts");
      expect(result).toHaveProperty("delayedServices");
      expect(result).toHaveProperty("activeCustomers");
      expect(result).toHaveProperty("monthlyRecurringRevenue");
      expect(result).toHaveProperty("servicesScheduledToday");
    });

    it("calcula MRR corretamente com contratos mensais", async () => {
      prismaMock.customer.count.mockResolvedValue(0);
      prismaMock.contract.count.mockResolvedValue(2);
      prismaMock.service.count.mockResolvedValue(0);
      prismaMock.employee.count.mockResolvedValue(0);
      prismaMock.contract.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prismaMock.service.groupBy.mockResolvedValue([]);
      prismaMock.$queryRaw.mockResolvedValue([{ avg: null }]);
      prismaMock.contract.findMany.mockResolvedValue([
        { amount: 300, frequency: "MONTHLY" },
        { amount: 600, frequency: "BIMONTHLY" },
      ]);

      const result = await dashboardService.getSummary("co-1");

      expect(result.monthlyRecurringRevenue).toBe(600);
    });
  });

  describe("getUpcomingServices", () => {
    it("retorna serviços dos próximos 7 dias", async () => {
      prismaMock.service.findMany.mockResolvedValue([]);

      const result = await dashboardService.getUpcomingServices("co-1");

      expect(Array.isArray(result)).toBe(true);
      expect(prismaMock.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: "co-1", deletedAt: null }),
        }),
      );
    });

    it("mapeia campos de serviços corretamente", async () => {
      const mockSvc = {
        id: "svc-1", serviceType: "PREVENTIVA", status: "SCHEDULED",
        scheduledAt: new Date("2026-06-25T10:00:00Z"),
        estimatedDurationMinutes: 60,
        customer: { id: "c-1", name: "Cliente", address: { city: "SP" } },
        employee: { id: "emp-1", name: "Técnico" },
      };
      prismaMock.service.findMany.mockResolvedValue([mockSvc]);

      const result = await dashboardService.getUpcomingServices("co-1");

      expect(result[0]).toHaveProperty("customerName", "Cliente");
      expect(result[0]).toHaveProperty("employeeName", "Técnico");
      expect(result[0]).toHaveProperty("scheduledDate");
    });
  });

  describe("getExpiringContracts", () => {
    it("retorna contratos que vencem nos próximos 30 dias", async () => {
      prismaMock.contract.findMany.mockResolvedValue([]);

      const result = await dashboardService.getExpiringContracts("co-1");

      expect(Array.isArray(result)).toBe(true);
      expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: "co-1", status: "ACTIVE" }),
        }),
      );
    });
  });

  describe("getMonthlyRevenue", () => {
    it("retorna receita mensal dos últimos 12 meses com $queryRaw", async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        { month: "2026-06", value: 1500, count: BigInt(3) },
      ]);

      const result = await dashboardService.getMonthlyRevenue("co-1");

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(12);
      const junIndex = result.findIndex((r) => r.month === "2026-06");
      expect(result[junIndex].value).toBe(1500);
    });

    it("preenche meses sem dados com value 0", async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      const result = await dashboardService.getMonthlyRevenue("co-1");

      expect(result).toHaveLength(12);
      result.forEach((row) => {
        expect(row.value).toBe(0);
        expect(row.services).toBe(0);
      });
    });
  });
});
