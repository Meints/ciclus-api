import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");
vi.mock("../../../modules/company/plan-limits", () => ({
  checkContractLimit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../utils/service-number", () => ({
  getNextServiceNumber: vi.fn().mockResolvedValue(1),
}));

import { prisma } from "../../../config/prisma";
import * as contractsService from "../contracts.service";

const prismaMock = prisma as any;

const mockContract = {
  id: "contract-1", companyId: "co-1", customerId: "cust-1",
  frequency: "MONTHLY" as const, amount: 1500, status: "ACTIVE",
  startDate: new Date("2025-01-01"), endDate: new Date("2025-12-31"),
  nextServiceDate: new Date("2025-01-01"), notes: null, renewCounter: 0,
  lastRenewedAt: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe("contracts.service", () => {
  describe("create", () => {
    it("cria contrato e primeira OS com sucesso", async () => {
      prismaMock.customer.findFirst.mockResolvedValue({ id: "cust-1" });
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          contract: { create: vi.fn().mockResolvedValue(mockContract) },
          service: { create: vi.fn().mockResolvedValue({ id: "svc-1" }) },
        };
        return fn(tx);
      });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await contractsService.create(
        "co-1",
        {
          customerId: "cust-1",
          frequency: "MONTHLY",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          amount: 1500,
        },
        "user-1",
      );

      expect(result.id).toBe("contract-1");
    });

    it("lança 404 se cliente não encontrado", async () => {
      prismaMock.customer.findFirst.mockResolvedValue(null);

      await expect(
        contractsService.create(
          "co-1",
          { customerId: "x", frequency: "MONTHLY", startDate: "2025-01-01", endDate: "2025-12-31", amount: 500 },
          "user-1",
        ),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("lança erro se data início >= data fim", async () => {
      prismaMock.customer.findFirst.mockResolvedValue({ id: "cust-1" });

      await expect(
        contractsService.create(
          "co-1",
          { customerId: "cust-1", frequency: "MONTHLY", startDate: "2025-12-31", endDate: "2025-01-01", amount: 500 },
          "user-1",
        ),
      ).rejects.toMatchObject({ statusCode: 400, code: "INVALID_DATES" });
    });
  });

  describe("cancel", () => {
    it("cancela contrato e OS agendadas", async () => {
      prismaMock.contract.findFirst.mockResolvedValue(mockContract);
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          contract: { update: vi.fn().mockResolvedValue({ ...mockContract, status: "CANCELLED" }) },
          service: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        };
        return fn(tx);
      });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await contractsService.cancel("co-1", "contract-1", { reason: "encerrado" }, "user-1");

      expect(result.status).toBe("CANCELLED");
    });

    it("lança 404 se contrato não encontrado", async () => {
      prismaMock.contract.findFirst.mockResolvedValue(null);

      await expect(
        contractsService.cancel("co-1", "x", { reason: "" }, "user-1"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("pause", () => {
    it("pausa contrato ativo", async () => {
      prismaMock.contract.findFirst.mockResolvedValue(mockContract);
      prismaMock.contract.update.mockResolvedValue({ ...mockContract, status: "PAUSED" });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await contractsService.pause("co-1", "contract-1", "user-1");

      expect(result.status).toBe("PAUSED");
    });

    it("lança erro se contrato não está ativo", async () => {
      prismaMock.contract.findFirst.mockResolvedValue({ ...mockContract, status: "PAUSED" });

      await expect(
        contractsService.pause("co-1", "contract-1", "user-1"),
      ).rejects.toMatchObject({ statusCode: 400, code: "INVALID_STATUS" });
    });
  });

  describe("resume", () => {
    it("retoma contrato pausado", async () => {
      prismaMock.contract.findFirst.mockResolvedValue({ ...mockContract, status: "PAUSED" });
      prismaMock.contract.update.mockResolvedValue({ ...mockContract, status: "ACTIVE" });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await contractsService.resume("co-1", "contract-1", "user-1");

      expect(result.status).toBe("ACTIVE");
    });

    it("lança erro se contrato não está pausado", async () => {
      prismaMock.contract.findFirst.mockResolvedValue(mockContract); // ACTIVE

      await expect(
        contractsService.resume("co-1", "contract-1", "user-1"),
      ).rejects.toMatchObject({ statusCode: 400, code: "INVALID_STATUS" });
    });
  });
});
