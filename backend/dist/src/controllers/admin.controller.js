"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingListings = getPendingListings;
exports.approveListing = approveListing;
exports.rejectListing = rejectListing;
exports.getAdminStats = getAdminStats;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const rejectSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3, 'Rejection reason must be at least 3 characters'),
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
        const updated = await prisma_1.default.listing.update({
            where: { id },
            data: {
                approvalStatus: 'APPROVED',
                rejectionReason: null,
            },
            include: {
                photos: true,
                campus: true,
            },
        });
        // Create Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                adminId: req.user.id,
                action: 'APPROVE_LISTING',
                targetType: 'LISTING',
                targetId: listing.id,
                description: `Admin approved listing "${listing.title}" by landlord ${listing.owner.name} (${listing.owner.email})`,
            },
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
        const updated = await prisma_1.default.listing.update({
            where: { id },
            data: {
                approvalStatus: 'REJECTED',
                rejectionReason: parsed.data.reason,
            },
            include: {
                photos: true,
                campus: true,
            },
        });
        // Create Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                adminId: req.user.id,
                action: 'REJECT_LISTING',
                targetType: 'LISTING',
                targetId: listing.id,
                description: `Admin rejected listing "${listing.title}" by landlord ${listing.owner.name}. Reason: ${parsed.data.reason}`,
            },
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
