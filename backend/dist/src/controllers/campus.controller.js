"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstitutions = getInstitutions;
exports.getAdminInstitutions = getAdminInstitutions;
exports.getInstitutionSuggestions = getInstitutionSuggestions;
exports.getCampusSuggestions = getCampusSuggestions;
exports.createInstitution = createInstitution;
exports.updateInstitution = updateInstitution;
exports.getCampuses = getCampuses;
exports.getAdminCampuses = getAdminCampuses;
exports.getCampusById = getCampusById;
exports.createCampus = createCampus;
exports.updateCampus = updateCampus;
exports.toggleCampusStatus = toggleCampusStatus;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const campus_validator_1 = require("../validators/campus.validator");
const response_1 = require("../utils/response");
const geocode_1 = require("../utils/geocode");
async function getInstitutions(req, res) {
    try {
        const institutions = await prisma_1.default.institution.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { campuses: true } },
            },
        });
        (0, response_1.sendSuccess)(res, institutions.map((institution) => ({
            id: institution.id,
            name: institution.name,
            shortName: institution.shortName,
            isActive: institution.isActive,
            createdAt: institution.createdAt,
        })));
    }
    catch (error) {
        console.error('getInstitutions error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch institutions', 500);
    }
}
async function getAdminInstitutions(_req, res) {
    try {
        const institutions = await prisma_1.default.institution.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { campuses: true } } },
        });
        (0, response_1.sendSuccess)(res, institutions.map((institution) => ({
            id: institution.id,
            name: institution.name,
            shortName: institution.shortName,
            isActive: institution.isActive,
            campusCount: institution._count.campuses,
            createdAt: institution.createdAt,
        })));
    }
    catch (error) {
        console.error('getAdminInstitutions error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch institutions', 500);
    }
}
async function getInstitutionSuggestions(req, res) {
    const query = zod_1.z.object({
        search: zod_1.z.string().trim().min(2).max(100),
    }).safeParse(req.query);
    if (!query.success) {
        (0, response_1.sendError)(res, query.error.errors[0].message, 400);
        return;
    }
    const url = new URL('https://api.openalex.org/institutions');
    url.searchParams.set('filter', 'country_code:ZA,type:education');
    url.searchParams.set('per-page', '100');
    url.searchParams.set('select', 'display_name,country_code,type,homepage_url');
    let response;
    try {
        response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    }
    catch (error) {
        console.error('getInstitutionSuggestions request failed:', error);
        (0, response_1.sendError)(res, 'The university suggestion service is temporarily unavailable.', 503);
        return;
    }
    if (!response.ok) {
        console.error(`getInstitutionSuggestions upstream responded with ${response.status} ${response.statusText}`);
        (0, response_1.sendError)(res, 'The university suggestion service is temporarily unavailable.', 503);
        return;
    }
    let payload;
    try {
        payload = await response.json();
    }
    catch (error) {
        console.error('getInstitutionSuggestions returned invalid JSON:', error);
        (0, response_1.sendError)(res, 'The university suggestion service returned invalid data.', 502);
        return;
    }
    const result = zod_1.z.object({
        results: zod_1.z.array(zod_1.z.object({
            display_name: zod_1.z.string().trim().min(1),
            country_code: zod_1.z.literal('ZA'),
            type: zod_1.z.literal('education'),
            homepage_url: zod_1.z.string().url().nullable().optional(),
        })),
    }).safeParse(payload);
    if (!result.success) {
        (0, response_1.sendError)(res, 'The university suggestion service returned invalid data.', 502);
        return;
    }
    const search = query.data.search.toLowerCase();
    const matches = result.data.results.filter((institution) => institution.display_name.toLowerCase().includes(search));
    (0, response_1.sendSuccess)(res, matches.slice(0, 50).map((institution) => {
        const homepage = institution.homepage_url ?? null;
        const domain = homepage ? new URL(homepage).hostname : null;
        return {
            name: institution.display_name,
            country: 'South Africa',
            countryCode: institution.country_code,
            domains: domain ? [domain] : [],
            webPages: homepage ? [homepage] : [],
        };
    }));
}
async function getCampusSuggestions(req, res) {
    const query = zod_1.z.object({
        institutionId: zod_1.z.string().uuid(),
    }).safeParse(req.query);
    if (!query.success) {
        (0, response_1.sendError)(res, query.error.errors[0].message, 400);
        return;
    }
    try {
        const institution = await prisma_1.default.institution.findUnique({
            where: { id: query.data.institutionId },
            select: { id: true, name: true, shortName: true, isActive: true },
        });
        if (!institution || !institution.isActive) {
            (0, response_1.sendError)(res, 'Select an active institution before searching for campuses.', 404);
            return;
        }
        const suggestions = await (0, geocode_1.searchInstitutionCampuses)(institution.name, institution.shortName);
        (0, response_1.sendSuccess)(res, suggestions);
    }
    catch (error) {
        if (error instanceof geocode_1.LocationServiceError) {
            (0, response_1.sendError)(res, error.message, error.statusCode);
            return;
        }
        console.error('getCampusSuggestions error:', error);
        (0, response_1.sendError)(res, 'Failed to search South African campuses.', 500);
    }
}
async function createInstitution(req, res) {
    try {
        const parsed = campus_validator_1.institutionSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const institution = await prisma_1.default.institution.create({ data: parsed.data });
        if (req.user) {
            await prisma_1.default.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'CREATE_INSTITUTION',
                    targetType: 'INSTITUTION',
                    targetId: institution.id,
                    description: `Created institution "${institution.name}".`,
                },
            });
        }
        (0, response_1.sendSuccess)(res, institution, 'Institution created successfully', 201);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            (0, response_1.sendError)(res, 'An institution with this name already exists', 409);
            return;
        }
        console.error('createInstitution error:', error);
        (0, response_1.sendError)(res, 'Failed to create institution', 500);
    }
}
async function updateInstitution(req, res) {
    try {
        const parsed = campus_validator_1.updateInstitutionSchema.safeParse(req.body);
        if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
            (0, response_1.sendError)(res, parsed.success ? 'At least one institution field is required.' : parsed.error.errors[0].message, 400);
            return;
        }
        const existing = await prisma_1.default.institution.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            (0, response_1.sendError)(res, 'Institution not found', 404);
            return;
        }
        const institution = await prisma_1.default.institution.update({ where: { id: existing.id }, data: parsed.data });
        if (req.user) {
            await prisma_1.default.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'UPDATE_INSTITUTION',
                    targetType: 'INSTITUTION',
                    targetId: institution.id,
                    description: `Updated institution "${institution.name}".`,
                },
            });
        }
        (0, response_1.sendSuccess)(res, institution, 'Institution updated successfully');
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            (0, response_1.sendError)(res, 'An institution with this name already exists', 409);
            return;
        }
        console.error('updateInstitution error:', error);
        (0, response_1.sendError)(res, 'Failed to update institution', 500);
    }
}
async function sendCampuses(req, res, includeInactive) {
    try {
        const institutionId = typeof req.query.institutionId === 'string' ? req.query.institutionId : undefined;
        const campuses = await prisma_1.default.campus.findMany({
            where: {
                ...(includeInactive ? {} : {
                    isActive: true,
                    institution: { is: { isActive: true } },
                }),
                ...(institutionId ? { institutionId } : {}),
            },
            include: {
                institution: true,
                _count: {
                    select: {
                        listings: { where: { approvalStatus: 'APPROVED' } },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const formatted = campuses.map((c) => ({
            id: c.id,
            institutionId: c.institutionId,
            institution: c.institution ? {
                id: c.institution.id,
                name: c.institution.name,
                shortName: c.institution.shortName,
            } : null,
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
async function getCampuses(req, res) {
    await sendCampuses(req, res, false);
}
async function getAdminCampuses(req, res) {
    await sendCampuses(req, res, true);
}
async function getCampusById(req, res) {
    try {
        const { id } = req.params;
        const campus = await prisma_1.default.campus.findUnique({
            where: { id },
            include: {
                institution: true,
                _count: {
                    select: {
                        listings: {
                            where: { approvalStatus: 'APPROVED' },
                        },
                    },
                },
            },
        });
        if (!campus || (req.user?.role !== 'ADMIN' && (!campus.isActive || !campus.institution?.isActive))) {
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
        const { name, institutionId, location, address, isActive } = parsed.data;
        const institution = await prisma_1.default.institution.findUnique({ where: { id: institutionId } });
        if (!institution) {
            (0, response_1.sendError)(res, 'Selected institution does not exist', 404);
            return;
        }
        const coordinates = await (0, geocode_1.resolveAddressCoordinates)(address, {
            locality: location,
            fallbackQuery: name,
        });
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
                institutionId,
                location,
                address,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                isActive: isActive ?? true,
            },
        });
        if (req.user) {
            await prisma_1.default.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'CREATE_CAMPUS',
                    targetType: 'CAMPUS',
                    targetId: campus.id,
                    description: `Created campus "${campus.name}".`,
                },
            });
        }
        (0, response_1.sendSuccess)(res, campus, 'Campus created successfully', 201);
    }
    catch (error) {
        console.error('createCampus error:', error);
        if (error instanceof geocode_1.LocationServiceError) {
            (0, response_1.sendError)(res, error.message, error.statusCode);
            return;
        }
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            (0, response_1.sendError)(res, 'A campus with this name already exists', 409);
            return;
        }
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
        if (parsed.data.institutionId) {
            const institution = await prisma_1.default.institution.findUnique({ where: { id: parsed.data.institutionId } });
            if (!institution) {
                (0, response_1.sendError)(res, 'Selected institution does not exist', 404);
                return;
            }
        }
        const newAddress = parsed.data.address ?? existing.address;
        const coordinates = parsed.data.address
            ? await (0, geocode_1.resolveAddressCoordinates)(newAddress)
            : { latitude: existing.latitude, longitude: existing.longitude };
        const listings = parsed.data.address
            ? await prisma_1.default.listing.findMany({ where: { campusId: id }, select: { id: true, address: true } })
            : [];
        const listingDistances = await Promise.all(listings.map(async (listing) => ({
            id: listing.id,
            distanceFromCampus: await (0, geocode_1.calculateRouteDistanceKm)(listing.address, newAddress),
        })));
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const savedCampus = await tx.campus.update({
                where: { id },
                data: {
                    ...parsed.data,
                    institutionId: parsed.data.institutionId ?? existing.institutionId,
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                },
            });
            for (const listing of listingDistances) {
                await tx.listing.update({ where: { id: listing.id }, data: { distanceFromCampus: listing.distanceFromCampus } });
            }
            return savedCampus;
        });
        if (req.user) {
            await prisma_1.default.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'UPDATE_CAMPUS',
                    targetType: 'CAMPUS',
                    targetId: id,
                    description: `Updated campus "${updated.name}".`,
                },
            });
        }
        (0, response_1.sendSuccess)(res, updated, 'Campus updated successfully');
    }
    catch (error) {
        console.error('updateCampus error:', error);
        if (error instanceof geocode_1.LocationServiceError) {
            (0, response_1.sendError)(res, error.message, error.statusCode);
            return;
        }
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
        if (req.user) {
            await prisma_1.default.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'CHANGE_CAMPUS_STATUS',
                    targetType: 'CAMPUS',
                    targetId: id,
                    description: `Campus "${campus.name}" ${campus.isActive ? 'activated' : 'deactivated'}.`,
                },
            });
        }
        (0, response_1.sendSuccess)(res, campus, `Campus ${campus.isActive ? 'activated' : 'deactivated'} successfully`);
    }
    catch (error) {
        console.error('toggleCampusStatus error:', error);
        (0, response_1.sendError)(res, 'Failed to toggle campus status', 500);
    }
}
