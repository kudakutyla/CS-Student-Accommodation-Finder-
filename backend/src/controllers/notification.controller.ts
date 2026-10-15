import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export async function getMyNotifications(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, notifications);
  } catch (error) {
    console.error('getMyNotifications error:', error);
    sendError(res, 'Failed to fetch notifications', 500);
  }
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      sendError(res, 'Notification not found', 404);
      return;
    }

    if (notification.userId !== req.user.id) {
      sendError(res, 'You cannot manage this notification.', 403);
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    sendSuccess(res, updated, 'Notification marked as read');
  } catch (error) {
    console.error('markNotificationRead error:', error);
    sendError(res, 'Failed to update notification', 500);
  }
}
