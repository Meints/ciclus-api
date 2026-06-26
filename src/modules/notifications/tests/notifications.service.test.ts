import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";

vi.mock("../../../config/prisma");

import { prisma } from "../../../config/prisma";
import * as notificationsService from "../notifications.service";

const prismaMock = prisma as any;

const mockNotification = {
  id: "notif-1", companyId: "co-1", userId: null, type: "SERVICE_COMPLETED",
  title: "Serviço concluído", body: "OS #42 concluída.",
  entityType: "Service", entityId: "svc-1",
  readAt: null, createdAt: new Date(),
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe("notifications.service", () => {
  describe("getNotifications", () => {
    it("retorna notificações paginadas da empresa", async () => {
      prismaMock.notification.findMany.mockResolvedValue([mockNotification]);
      prismaMock.notification.count.mockResolvedValue(1);

      const result = await notificationsService.getNotifications("co-1", "user-1");

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result).toHaveProperty("unreadCount");
    });
  });

  describe("markRead", () => {
    it("marca notificação como lida", async () => {
      prismaMock.notification.findFirst.mockResolvedValue(mockNotification);
      prismaMock.notification.update.mockResolvedValue({ ...mockNotification, readAt: new Date() });

      const result = await notificationsService.markRead("co-1", "notif-1");

      expect(prismaMock.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { readAt: expect.any(Date) } }),
      );
    });

    it("lança 404 se notificação não encontrada", async () => {
      prismaMock.notification.findFirst.mockResolvedValue(null);

      await expect(notificationsService.markRead("co-1", "x")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("markAllRead", () => {
    it("marca todas as notificações da empresa como lidas", async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

      await notificationsService.markAllRead("co-1", "user-1");

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: "co-1", readAt: null }),
          data: { readAt: expect.any(Date) },
        }),
      );
    });
  });

  describe("createNotification", () => {
    it("cria notificação com sucesso", async () => {
      prismaMock.notification.create.mockResolvedValue(mockNotification);

      await notificationsService.createNotification({
        companyId: "co-1", type: "SERVICE_COMPLETED",
        title: "Serviço concluído", body: "OS #42",
        entityType: "Service", entityId: "svc-1",
      });

      expect(prismaMock.notification.create).toHaveBeenCalled();
    });
  });
});
