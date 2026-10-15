"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyNotifications = getMyNotifications;
exports.markNotificationRead = markNotificationRead;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
async function getMyNotifications(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const notifications = await prisma_1.default.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.sendSuccess)(res, notifications);
    }
    catch (error) {
        console.error('getMyNotifications error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch notifications', 500);
    }
}
async function markNotificationRead(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const notification = await prisma_1.default.notification.findUnique({ where: { id } });
        if (!notification) {
            (0, response_1.sendError)(res, 'Notification not found', 404);
            return;
        }
        if (notification.userId !== req.user.id) {
            (0, response_1.sendError)(res, 'You cannot manage this notification.', 403);
            return;
        }
        const updated = await prisma_1.default.notification.update({
            where: { id },
            data: { isRead: true },
        });
        (0, response_1.sendSuccess)(res, updated, 'Notification marked as read');
    }
    catch (error) {
        console.error('markNotificationRead error:', error);
        (0, response_1.sendError)(res, 'Failed to update notification', 500);
    }
}
