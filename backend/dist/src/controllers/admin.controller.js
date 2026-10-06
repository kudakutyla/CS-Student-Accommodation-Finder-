"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingListings = getPendingListings;
exports.approveListing = approveListing;
exports.rejectListing = rejectListing;
exports.getAdminStats = getAdminStats;
exports.getAdminUsers = getAdminUsers;
exports.updateAdminUser = updateAdminUser;
exports.getAdminAuditLogs = getAdminAuditLogs;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const rejectSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3, 'Rejection reason must be at least 3 characters'),
});
const userUpdateSchema = zod_1.z.object({
    isVerified: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
}).refine((data) => data.isVerified !== undefined || data.isActive !== undefined, {
    message: 'At least one account setting must be provided.',
});
async function getPendingListings(req, res) {
    try {
        const pendingListings = await prisma_1.default.listing.findMany({
            where: { approvalStatus: 'PENDING' },
            include: {
                photos: true,
                campus: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        isVerified: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        (0, response_1.sendSuccess)(res, pendingListings);
    }
    catch (error) {
        console.error('getPendingListings error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch pending listings', 500);
    }
}
async function approveListing(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const listing = await prisma_1.default.listing.findUnique({
            where: { id },
            include: { owner: true },
        });
        if (!listing) {
            (0, response_1.sendError)(res, 'Listing not found', 404);
            return;
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const savedListing = await tx.listing.update({
                where: { id },
                data: { approvalStatus: 'APPROVED', rejectionReason: null },
                include: { photos: true, campus: true },
            });
            await tx.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'APPROVE_LISTING',
                    targetType: 'LISTING',
                    targetId: listing.id,
                    description: `Admin approved listing "${listing.title}" by landlord ${listing.owner.name} (${listing.owner.email})`,
                },
            });
            await tx.notification.create({
                data: {
                    userId: listing.ownerId,
                    type: 'LISTING_APPROVED',
                    title: 'Listing approved',
                    message: `"${listing.title}" is now visible to students.`,
                },
            });
            return savedListing;
        });
        (0, response_1.sendSuccess)(res, updated, 'Listing approved successfully');
    }
    catch (error) {
        console.error('approveListing error:', error);
        (0, response_1.sendError)(res, 'Failed to approve listing', 500);
    }
}
async function rejectListing(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const parsed = rejectSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const listing = await prisma_1.default.listing.findUnique({
            where: { id },
            include: { owner: true },
        });
        if (!listing) {
            (0, response_1.sendError)(res, 'Listing not found', 404);
            return;
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const savedListing = await tx.listing.update({
                where: { id },
                data: { approvalStatus: 'REJECTED', rejectionReason: parsed.data.reason },
                include: { photos: true, campus: true },
            });
            await tx.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'REJECT_LISTING',
                    targetType: 'LISTING',
                    targetId: listing.id,
                    description: `Admin rejected listing "${listing.title}" by landlord ${listing.owner.name}. Reason: ${parsed.data.reason}`,
                },
            });
            await tx.notification.create({
                data: {
                    userId: listing.ownerId,
                    type: 'LISTING_REJECTED',
                    title: 'Listing needs changes',
                    message: `"${listing.title}" was not approved: ${parsed.data.reason}`,
                },
            });
            return savedListing;
        });
        (0, response_1.sendSuccess)(res, updated, 'Listing rejected');
    }
    catch (error) {
        console.error('rejectListing error:', error);
        (0, response_1.sendError)(res, 'Failed to reject listing', 500);
    }
}
async function getAdminStats(_req, res) {
    try {
        const [totalStudents, totalLandlords, verifiedLandlords, totalListings, pendingListings, approvedListings, totalCampuses,] = await Promise.all([
            prisma_1.default.user.count({ where: { role: 'STUDENT' } }),
            prisma_1.default.user.count({ where: { role: 'LANDLORD' } }),
            prisma_1.default.user.count({ where: { role: 'LANDLORD', isVerified: true } }),
            prisma_1.default.listing.count(),
            prisma_1.default.listing.count({ where: { approvalStatus: 'PENDING' } }),
            prisma_1.default.listing.count({ where: { approvalStatus: 'APPROVED' } }),
            prisma_1.default.campus.count({ where: { isActive: true } }),
        ]);
        (0, response_1.sendSuccess)(res, {
            totalStudents,
            totalLandlords,
            verifiedLandlords,
            totalListings,
            pendingListings,
            approvedListings,
            totalCampuses,
        });
    }
    catch (error) {
        console.error('getAdminStats error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch admin stats', 500);
    }
}
async function getAdminUsers(_req, res) {
    try {
        const users = await prisma_1.default.user.findMany({
            where: { role: { in: ['STUDENT', 'LANDLORD'] } },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.sendSuccess)(res, users);
    }
    catch (error) {
        console.error('getAdminUsers error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch users', 500);
    }
}
async function updateAdminUser(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const parsed = userUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const target = await prisma_1.default.user.findUnique({ where: { id: req.params.id } });
        if (!target || target.role === 'ADMIN') {
            (0, response_1.sendError)(res, 'Managed user not found', 404);
            return;
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const savedUser = await tx.user.update({
                where: { id: target.id },
                data: parsed.data,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isVerified: true,
                    isActive: true,
                    createdAt: true,
                },
            });
            await tx.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'UPDATE_USER_ACCOUNT',
                    targetType: 'USER',
                    targetId: target.id,
                    description: `Admin updated account flags: ${JSON.stringify(parsed.data)}.`,
                },
            });
            return savedUser;
        });
        (0, response_1.sendSuccess)(res, updated, 'User account updated');
    }
    catch (error) {
        console.error('updateAdminUser error:', error);
        (0, response_1.sendError)(res, 'Failed to update user account', 500);
    }
}
async function getAdminAuditLogs(_req, res) {
    try {
        const isCalendarDate = (value) => !value || (!Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
            && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value);
        const filterSchema = zod_1.z.object({
            from: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
            to: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
            targetType: zod_1.z.enum(['USER', 'REPORT', 'LISTING', 'CAMPUS', 'INSTITUTION', 'SYSTEM']).optional(),
        }).refine((filters) => isCalendarDate(filters.from) && isCalendarDate(filters.to), {
            message: 'Enter valid calendar dates.',
        }).refine((filters) => !filters.from || !filters.to || filters.from <= filters.to, {
            message: 'Start date must be on or before end date.',
        });
        const parsed = filterSchema.safeParse(_req.query);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const where = {};
        if (parsed.data.targetType)
            where.targetType = parsed.data.targetType;
        if (parsed.data.from || parsed.data.to) {
            where.createdAt = {};
            if (parsed.data.from)
                where.createdAt.gte = new Date(`${parsed.data.from}T00:00:00.000Z`);
            if (parsed.data.to) {
                const exclusiveEnd = new Date(`${parsed.data.to}T00:00:00.000Z`);
                exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
                where.createdAt.lt = exclusiveEnd;
            }
        }
        const logs = await prisma_1.default.auditLog.findMany({
            where,
            include: { admin: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        (0, response_1.sendSuccess)(res, logs);
    }
    catch (error) {
        console.error('getAdminAuditLogs error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch audit history', 500);
    }
}
