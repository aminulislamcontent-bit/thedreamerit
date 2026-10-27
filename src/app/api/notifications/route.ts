// Notifications API
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, unauthorized, apiHandler } from '@/lib/api';
import { getSession } from '@/lib/auth';

export const GET = apiHandler(async () => {
  const user = await getSession();
  if (!user) return unauthorized();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return ok({ notifications, unreadCount });
});

export const PUT = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { notificationId, markAllRead } = body;

  if (markAllRead) {
    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return ok({ success: true });
  }

  if (notificationId) {
    await db.notification.update({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true },
    });
    return ok({ success: true });
  }

  return ok({ success: false });
});
