import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { buildSkip, buildMeta } from "../../utils/pagination";

const PAGE_SIZE = 20;

export async function getNotifications(companyId: string, userId: string, page = 1) {
  const safePage = Math.max(1, page);
  const pagination = { page: safePage, limit: PAGE_SIZE };

  // Show company-level notifications (userId null) plus notifications targeted to this user.
  const where = {
    companyId,
    OR: [{ userId: null }, { userId }],
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: buildSkip(pagination),
      take: pagination.limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
  ]);

  return {
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      entityType: n.entityType,
      entityId: n.entityId,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
    meta: buildMeta(total, pagination),
  };
}

export async function markRead(companyId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, companyId },
  });
  if (!notification) throw new AppError("Notificação não encontrada", 404, "NOT_FOUND");

  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: notification.readAt ?? new Date() },
  });

  return { success: true };
}

export async function markAllRead(companyId: string, userId: string) {
  await prisma.notification.updateMany({
    where: {
      companyId,
      readAt: null,
      OR: [{ userId: null }, { userId }],
    },
    data: { readAt: new Date() },
  });

  return { success: true };
}

export async function createNotification(data: {
  companyId: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}) {
  return prisma.notification.create({
    data: {
      companyId: data.companyId,
      userId: data.userId ?? null,
      type: data.type,
      title: data.title,
      body: data.body,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
    },
  });
}
