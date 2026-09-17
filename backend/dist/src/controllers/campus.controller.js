"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCampuses = getCampuses;
exports.getCampusById = getCampusById;
exports.createCampus = createCampus;
exports.updateCampus = updateCampus;
exports.toggleCampusStatus = toggleCampusStatus;
const prisma_1 = __importDefault(require("../config/prisma"));
const campus_validator_1 = require("../validators/campus.validator");
const response_1 = require("../utils/response");
const distance_1 = require("../utils/distance");
async function getCampuses(req, res) {
    try {
        const includeInactive = req.query.all === 'true' && req.user?.role === 'ADMIN';
        const campuses = await prisma_1.default.campus.findMany({
            where: includeInactive ? undefined : { isActive: true },
            include: {
                _count: {
                    select: {
                        listings: {
                            where: { approvalStatus: 'APPROVED' },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const formatted = campuses.map((c) => ({
            id: c.id,
            name: c.name,
            location: c.location,
            address: c.address,
            latitude: c.latitude,
            longitude: c.longitude,
            isActive: c.isActive,
            listingCount: c._count.listings,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));
        (0, response_1.sendSuccess)(res, formatted);
    }
    catch (error) {
        console.error('getCampuses error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch campuses', 500);
    }
}
async function getCampusById(req, res) {
    try {
        const { id } = req.params;
        const campus = await prisma_1.default.campus.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        listings: {
                            where: { approvalStatus: 'APPROVED' },
                        },
                    },
                },
            },
        });
        if (!campus) {
            (0, response_1.sendError)(res, 'Campus not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, {
            ...campus,
            listingCount: campus._count.listings,
        });
    }
    catch (error) {
        console.error('getCampusById error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch campus', 500);
    }
}
async function createCampus(req, res) {
    try {
        const parsed = campus_validator_1.createCampusSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const { name, location, address, latitude, longitude, isActive } = parsed.data;
        const existing = await prisma_1.default.campus.findUnique({
            where: { name },
        });
        if (existing) {
            (0, response_1.sendError)(res, 'A campus with this name already exists', 409);
            return;
        }
        const campus = await prisma_1.default.campus.create({
            data: {
                name,
                location,
                address,
                latitude,
                longitude,
                isActive: isActive ?? true,
            },
        });
        (0, response_1.sendSuccess)(res, campus, 'Campus created successfully', 201);
    }
    catch (error) {
        console.error('createCampus error:', error);
        (0, response_1.sendError)(res, 'Failed to create campus', 500);
    }
}
async function updateCampus(req, res) {
    try {
        const { id } = req.params;
        const existing = await prisma_1.default.campus.findUnique({
            where: { id },
        });
        if (!existing) {
            (0, response_1.sendError)(res, 'Campus not found', 404);
            return;
        }
        const parsed = campus_validator_1.updateCampusSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const updated = await prisma_1.default.campus.update({
            where: { id },
            data: parsed.data,
        });
        // If coordinates changed, recompute distance for associated listings
        if ((parsed.data.latitude !== undefined && parsed.data.latitude !== existing.latitude) ||
            (parsed.data.longitude !== undefined && parsed.data.longitude !== existing.longitude)) {
            const listings = await prisma_1.default.listing.findMany({
                where: { campusId: id },
                select: { id: true, latitude: true, longitude: true },
            });
            for (const listing of listings) {
                const newDist = (0, distance_1.calculateHaversineDistance)(listing.latitude, listing.longitude, updated.latitude, updated.longitude);
                await prisma_1.default.listing.update({
                    where: { id: listing.id },
                    data: { distanceFromCampus: newDist },
                });
            }
        }
        (0, response_1.sendSuccess)(res, updated, 'Campus updated successfully');
    }
    catch (error) {
        console.error('updateCampus error:', error);
        (0, response_1.sendError)(res, 'Failed to update campus', 500);
    }
}
async function toggleCampusStatus(req, res) {
    try {
        const { id } = req.params;
        const existing = await prisma_1.default.campus.findUnique({ where: { id } });
        if (!existing) {
            (0, response_1.sendError)(res, 'Campus not found', 404);
            return;
        }
        const parsed = campus_validator_1.toggleCampusStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const campus = await prisma_1.default.campus.update({
            where: { id },
            data: { isActive: parsed.data.isActive },
        });
        (0, response_1.sendSuccess)(res, campus, `Campus ${campus.isActive ? 'activated' : 'deactivated'} successfully`);
    }
    catch (error) {
        console.error('toggleCampusStatus error:', error);
        (0, response_1.sendError)(res, 'Failed to toggle campus status', 500);
    }
}
