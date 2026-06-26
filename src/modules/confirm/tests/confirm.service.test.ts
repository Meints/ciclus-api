import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");
vi.mock("../../../modules/notifications/notifications.service", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../integrations/pdf/pdf.service", () => ({
  generateServiceReport: vi.fn().mockResolvedValue(null),
}));
vi.mock("../services/services.helpers", () => ({
  buildServiceReportData: vi.fn().mockResolvedValue({}),
}), { virtual: true });
vi.mock("../../services/services.helpers", () => ({
  buildServiceReportData: vi.fn().mockResolvedValue({}),
}));

import { prisma } from "../../../config/prisma";
import * as confirmService from "../confirm.service";

const prismaMock = prisma as any;

const futureDate = new Date(Date.now() + 86400000);

const mockServiceForConfirmationData = {
  id: "svc-1", serviceNumber: 42, companyId: "co-1",
  confirmationToken: "valid-token", confirmationTokenExpiresAt: futureDate,
  confirmedAt: null,
  serviceType: "PREVENTIVA", scheduledAt: new Date(), completedDate: new Date(),
  employee: { name: "Técnico" },
  company: { name: "Test Co", logoUrl: null },
  customer: { id: "cust-1", name: "Cliente", address: {} },
  equipment: [],
};

const mockServiceForConfirm = {
  id: "svc-1", serviceNumber: 42, companyId: "co-1",
  confirmationTokenExpiresAt: futureDate,
  confirmedAt: null,
};

beforeEach(() => {
  mockReset(prismaMock);
  prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
});

describe("confirm.service", () => {
  describe("getConfirmationData", () => {
    it("retorna dados do serviço com token válido", async () => {
      prismaMock.service.findUnique.mockResolvedValue(mockServiceForConfirmationData);

      const result = await confirmService.getConfirmationData("valid-token");

      expect(result).toHaveProperty("serviceNumber", 42);
      expect(result).toHaveProperty("customerName", "Cliente");
    });

    it("lança 404 com token inválido", async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(confirmService.getConfirmationData("invalid")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 410 se token expirado", async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        ...mockServiceForConfirmationData,
        confirmationTokenExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(confirmService.getConfirmationData("expired")).rejects.toMatchObject({
        statusCode: 410,
      });
    });

    it("retorna alreadyConfirmed se serviço já confirmado", async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        ...mockServiceForConfirmationData, confirmedAt: new Date(),
      });

      const result = await confirmService.getConfirmationData("valid-token");

      expect(result).toHaveProperty("alreadyConfirmed", true);
    });
  });

  describe("confirm", () => {
    it("confirma serviço com dados válidos", async () => {
      prismaMock.service.findUnique.mockResolvedValue(mockServiceForConfirm);
      prismaMock.service.update.mockResolvedValue({ ...mockServiceForConfirm, status: "CONFIRMED" });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await confirmService.confirm("valid-token", "127.0.0.1", "Mozilla/5.0", "João Cliente", "123.456.789-00", "CPF");

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("serviceNumber", 42);
    });

    it("lança 409 se serviço já confirmado", async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        ...mockServiceForConfirm, confirmedAt: new Date(),
      });

      await expect(
        confirmService.confirm("valid-token", "127.0.0.1", "UA", "x"),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("lança 410 se token expirado", async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        ...mockServiceForConfirm,
        confirmationTokenExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        confirmService.confirm("expired-token", "127.0.0.1", "UA", "x"),
      ).rejects.toMatchObject({ statusCode: 410 });
    });
  });
});
