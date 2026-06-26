import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");
vi.mock("../../../modules/company/plan-limits", () => ({
  checkMonthlyServiceLimit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../utils/service-number", () => ({
  getNextServiceNumber: vi.fn().mockResolvedValue(42),
}));
vi.mock("../../../modules/notifications/notifications.service", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../service-types", () => ({
  isValidServiceTypeForNiche: vi.fn().mockReturnValue(true),
}));

import { prisma } from "../../../config/prisma";
import * as servicesService from "../services.service";

const prismaMock = prisma as any;

const mockCompany = { id: "co-1", name: "Test Co", niche: "AIR_CONDITIONING" };
const mockCustomer = { id: "cust-1", name: "Cliente", email: "c@c.com", phone: "11999999999" };
const mockEmployee = { id: "emp-1", name: "Técnico" };
const mockService = {
  id: "svc-1", serviceNumber: 42, companyId: "co-1", customerId: "cust-1",
  employeeId: "emp-1", contractId: null, serviceType: "PREVENTIVA",
  scheduledAt: new Date(Date.now() + 3600000), status: "SCHEDULED",
  amount: 200, estimatedDurationMinutes: 60, executionNotes: null,
  durationMinutes: null, completedDate: null, paidAt: null, isPaid: false,
  confirmationToken: null, confirmationTokenExpiresAt: null,
  confirmedAt: null, reportUrl: null, deletedAt: null,
  createdAt: new Date(), updatedAt: new Date(),
  customer: mockCustomer,
  company: mockCompany,
  employee: mockEmployee,
  equipment: [],
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe("services.service", () => {
  describe("list", () => {
    it("retorna lista paginada de serviços", async () => {
      prismaMock.service.findMany.mockResolvedValue([mockService]);
      prismaMock.service.count.mockResolvedValue(1);

      const result = await servicesService.list("co-1", {}, {}, "OWNER");

      expect(result.data).toHaveLength(1);
    });

    it("filtra por employeeId quando passado nos filtros", async () => {
      prismaMock.service.findMany.mockResolvedValue([mockService]);
      prismaMock.service.count.mockResolvedValue(1);

      await servicesService.list("co-1", { employeeId: "emp-1" }, {}, "OWNER");

      expect(prismaMock.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ employeeId: "emp-1" }),
        }),
      );
    });
  });

  describe("getById", () => {
    it("retorna serviço existente", async () => {
      prismaMock.service.findFirst.mockResolvedValue(mockService);

      const result = await servicesService.getById("co-1", "svc-1", "OWNER");

      expect(result.id).toBe("svc-1");
    });

    it("lança 404 se não encontrado", async () => {
      prismaMock.service.findFirst.mockResolvedValue(null);

      await expect(servicesService.getById("co-1", "x", "OWNER")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("start", () => {
    it("muda status para IN_PROGRESS", async () => {
      prismaMock.service.findFirst.mockResolvedValue(mockService);
      prismaMock.service.update.mockResolvedValue({ ...mockService, status: "IN_PROGRESS" });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await servicesService.start("co-1", "svc-1", "user-1");

      expect(prismaMock.service.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "IN_PROGRESS" }) }),
      );
    });

    it("lança erro se status não é SCHEDULED", async () => {
      prismaMock.service.findFirst.mockResolvedValue({ ...mockService, status: "IN_PROGRESS" });

      await expect(servicesService.start("co-1", "svc-1", "user-1")).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_STATUS",
      });
    });

    it("lança 404 se não encontrado", async () => {
      prismaMock.service.findFirst.mockResolvedValue(null);

      await expect(servicesService.start("co-1", "x", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("cancel", () => {
    it("cancela serviço agendado", async () => {
      prismaMock.service.findFirst.mockResolvedValue(mockService);
      prismaMock.service.update.mockResolvedValue({ ...mockService, status: "CANCELLED" });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await servicesService.cancel("co-1", "svc-1", { reason: "cliente cancelou" }, "user-1");

      expect(prismaMock.service.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) }),
      );
    });

    it("não permite cancelar serviço concluído", async () => {
      prismaMock.service.findFirst.mockResolvedValue({ ...mockService, status: "COMPLETED" });

      await expect(
        servicesService.cancel("co-1", "svc-1", { reason: "" }, "user-1"),
      ).rejects.toMatchObject({ statusCode: 409, code: "INVALID_STATUS" });
    });
  });

  describe("reschedule", () => {
    it("reagenda e define status RESCHEDULED", async () => {
      prismaMock.service.findFirst.mockResolvedValue(mockService);
      prismaMock.service.findMany.mockResolvedValue([]); // sem conflitos
      prismaMock.service.update.mockResolvedValue({ ...mockService, status: "RESCHEDULED" });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const futureDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const result = await servicesService.reschedule("co-1", "svc-1", { scheduledAt: futureDate });

      expect(prismaMock.service.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "RESCHEDULED" }) }),
      );
    });

    it("lança erro se data no passado", async () => {
      prismaMock.service.findFirst.mockResolvedValue(mockService);

      await expect(
        servicesService.reschedule("co-1", "svc-1", { scheduledAt: "2020-01-01" }),
      ).rejects.toMatchObject({ statusCode: 400, code: "INVALID_DATE" });
    });
  });

  describe("togglePaid", () => {
    it("alterna status de pagamento", async () => {
      const fullService = {
        ...mockService, status: "COMPLETED", isPaid: false,
        customer: mockCustomer, employee: mockEmployee, company: mockCompany,
        equipment: [], photos: [], completedDate: new Date(),
      };
      prismaMock.service.findFirst.mockResolvedValue(fullService);
      prismaMock.service.update.mockResolvedValue({ ...fullService, isPaid: true });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await servicesService.togglePaid("co-1", "svc-1");

      expect(prismaMock.service.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isPaid: true }) }),
      );
    });
  });

  describe("resendConfirmation", () => {
    it("gera novo token e envia notificações", async () => {
      prismaMock.service.findFirst.mockResolvedValue({
        ...mockService, status: "COMPLETED",
        customer: mockCustomer, company: mockCompany,
      });
      prismaMock.service.update.mockResolvedValue({ ...mockService, status: "COMPLETED" });

      const result = await servicesService.resendConfirmation("co-1", "svc-1");

      expect(result.confirmationToken).toBeDefined();
      expect(prismaMock.service.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confirmationToken: expect.any(String),
            confirmationTokenExpiresAt: expect.any(Date),
          }),
        }),
      );
    });

    it("lança erro se serviço não foi concluído", async () => {
      prismaMock.service.findFirst.mockResolvedValue(mockService); // SCHEDULED

      await expect(servicesService.resendConfirmation("co-1", "svc-1")).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_STATUS",
      });
    });
  });
});
