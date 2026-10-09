"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = createReport;
exports.getAdminReports = getAdminReports;
exports.getMyReports = getMyReports;
exports.updateReportStatus = updateReportStatus;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const reportSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3, 'Reason must be at least 3 characters').max(200),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(2000),
});
const reportStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['IN_REVIEW', 'RESOLVED', 'DISMISSED']),
    adminReviewNote: zod_1.z.string().trim().max(2000, 'Review note must be 2000 characters or fewer').optional().default(''),
});
async function createReport(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const parsed = reportSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const listing = await prisma_1.default.listing.findUnique({ where: { id } });
        if (!listing) {
            (0, response_1.sendError)(res, 'Listing not found', 404);
            return;
        }
        if (listing.approvalStatus !== 'APPROVED') {
            (0, response_1.sendError)(res, 'Only approved listings can be reported.', 400);
            return;
        }
        const report = await prisma_1.default.report.create({
            data: {
                userId: req.user.id,
                listingId: id,
                reason: parsed.data.reason,
                description: parsed.data.description,
                status: 'PENDING',
            },
            select: {
                id: true,
                userId: true,
                listingId: true,
                reason: true,
                description: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        let message = 'Report submitted successfully';
        try {
            const admins = await prisma_1.default.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
            if (admins.length) {
                await prisma_1.default.notification.createMany({
                    data: admins.map((admin) => ({
                        userId: admin.id,
                        type: 'NEW_REPORT',
                        title: 'A listing was reported',
                        message: `A student reported "${listing.title}" for ${parsed.data.reason}.`,
                    })),
                });
            }
        }
        catch (error) {
            console.error('createReport admin notification error:', error);
            message = 'Report submitted successfully, but administrators could not be notified.';
        }
        (0, response_1.sendSuccess)(res, report, message, 201);
    }
    catch (error) {
        console.error('createReport error:', error);
        (0, response_1.sendError)(res, 'Failed to submit report', 500);
    }
}
async function getAdminReports(_req, res) {
    try {
        const reports = await prisma_1.default.report.findMany({
            select: {
                id: true,
                reason: true,
                description: true,
                status: true,
                createdAt: true,
                listing: { select: { id: true, title: true, approvalStatus: true } },
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        (0, response_1.sendSuccess)(res, reports);
    }
    catch (error) {
        console.error('getAdminReports error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch reports', 500);
    }
}
async function getMyReports(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const reports = await prisma_1.default.report.findMany({
            where: { userId: req.user.id },
            select: {
                id: true,
                reason: true,
                description: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                listing: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.sendSuccess)(res, reports);
    }
    catch (error) {
        console.error('getMyReports error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch your reports', 500);
    }
}
async function updateReportStatus(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const parsed = reportStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const report = await prisma_1.default.report.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                userId: true,
                status: true,
                listing: { select: { title: true } },
            },
        });
        if (!report) {
            (0, response_1.sendError)(res, 'Report not found', 404);
            return;
        }
        if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
            (0, response_1.sendError)(res, 'This report has already been closed.', 409);
            return;
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const savedReport = await tx.report.update({
                where: { id: report.id },
                data: { status: parsed.data.status },
                select: { id: true, status: true, updatedAt: true },
            });
            await tx.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'UPDATE_REPORT_STATUS',
                    targetType: 'REPORT',
                    targetId: report.id,
                    description: `Report for listing "${report.listing.title}" changed from ${report.status} to ${parsed.data.status}.`,
                },
            });
            await tx.notification.create({
                data: {
                    userId: report.userId,
                    type: 'REPORT_STATUS',
                    title: 'Your report was reviewed',
                    message: [
                        `Your report about "${report.listing.title}" is now ${parsed.data.status.toLowerCase().replace('_', ' ')}.`,
                        parsed.data.adminReviewNote ? `Admin note: ${parsed.data.adminReviewNote}` : '',
                    ].filter(Boolean).join('\n\n'),
                },
            });
            return savedReport;
        });
        (0, response_1.sendSuccess)(res, updated, 'Report status updated');
    }
    catch (error) {
        console.error('updateReportStatus error:', error);
        (0, response_1.sendError)(res, 'Failed to update report status', 500);
    }
}
