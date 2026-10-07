import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import {
  createCampusSchema,
  institutionSchema,
  toggleCampusStatusSchema,
  updateCampusSchema,
  updateInstitutionSchema,
} from '../validators/campus.validator';
import { sendSuccess, sendError } from '../utils/response';
import { calculateGoogleRouteDistanceKm, GoogleMapsError, resolveAddressCoordinates } from '../utils/geocode';

export async function getInstitutions(req: Request, res: Response): Promise<void> {
  try {
    const institutions = await prisma.institution.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { campuses: true } },
      },
    });

    sendSuccess(
      res,
      institutions.map((institution) => ({
        id: institution.id,
        name: institution.name,
        shortName: institution.shortName,
        isActive: institution.isActive,
        createdAt: institution.createdAt,
      }))
    );
  } catch (error) {
    console.error('getInstitutions error:', error);
    sendError(res, 'Failed to fetch institutions', 500);
  }
}

export async function getAdminInstitutions(_req: Request, res: Response): Promise<void> {
  try {
    const institutions = await prisma.institution.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { campuses: true } } },
    });
    sendSuccess(res, institutions.map((institution) => ({
      id: institution.id,
      name: institution.name,
      shortName: institution.shortName,
      isActive: institution.isActive,
      campusCount: institution._count.campuses,
      createdAt: institution.createdAt,
    })));
  } catch (error) {
    console.error('getAdminInstitutions error:', error);
    sendError(res, 'Failed to fetch institutions', 500);
  }
}

export async function getInstitutionSuggestions(req: Request, res: Response): Promise<void> {
  const query = z.object({
    search: z.string().trim().min(2).max(100).optional(),
  }).safeParse(req.query);
  if (!query.success) {
    sendError(res, query.error.errors[0].message, 400);
    return;
  }

  const url = new URL('https://universities.hipolabs.com/search');
  url.searchParams.set('country', 'South Africa');
  if (query.data.search) url.searchParams.set('name', query.data.search);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      sendError(res, 'The university suggestion service is temporarily unavailable.', 503);
      return;
    }

    const result = z.array(z.object({
      name: z.string().min(1),
      country: z.string(),
      alpha_two_code: z.string().nullable().optional(),
      domains: z.array(z.string()).nullable().optional(),
      web_pages: z.array(z.string().url()).nullable().optional(),
    })).safeParse(await response.json());
    if (!result.success) {
      sendError(res, 'The university suggestion service returned invalid data.', 502);
      return;
    }

    sendSuccess(res, result.data.slice(0, 50).map((institution) => ({
      name: institution.name,
      country: institution.country,
      countryCode: institution.alpha_two_code ?? null,
      domains: institution.domains ?? [],
      webPages: institution.web_pages ?? [],
    })));
  } catch (error) {
    console.error('getInstitutionSuggestions error:', error);
    sendError(res, 'The university suggestion service is temporarily unavailable.', 503);
  }
}

export async function createInstitution(req: Request, res: Response): Promise<void> {
  try {
    const parsed = institutionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }
    const institution = await prisma.institution.create({ data: parsed.data });
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'CREATE_INSTITUTION',
          targetType: 'INSTITUTION',
          targetId: institution.id,
          description: `Created institution "${institution.name}".`,
        },
      });
    }
    sendSuccess(res, institution, 'Institution created successfully', 201);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      sendError(res, 'An institution with this name already exists', 409);
      return;
    }
    console.error('createInstitution error:', error);
    sendError(res, 'Failed to create institution', 500);
  }
}

export async function updateInstitution(req: Request, res: Response): Promise<void> {
  try {
    const parsed = updateInstitutionSchema.safeParse(req.body);
    if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
      sendError(res, parsed.success ? 'At least one institution field is required.' : parsed.error.errors[0].message, 400);
      return;
    }
    const existing = await prisma.institution.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      sendError(res, 'Institution not found', 404);
      return;
    }
    const institution = await prisma.institution.update({ where: { id: existing.id }, data: parsed.data });
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'UPDATE_INSTITUTION',
          targetType: 'INSTITUTION',
          targetId: institution.id,
          description: `Updated institution "${institution.name}".`,
        },
      });
    }
    sendSuccess(res, institution, 'Institution updated successfully');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      sendError(res, 'An institution with this name already exists', 409);
      return;
    }
    console.error('updateInstitution error:', error);
    sendError(res, 'Failed to update institution', 500);
  }
}

async function sendCampuses(req: Request, res: Response, includeInactive: boolean): Promise<void> {
  try {
    const institutionId = typeof req.query.institutionId === 'string' ? req.query.institutionId : undefined;

    const campuses = await prisma.campus.findMany({
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

    sendSuccess(res, formatted);
  } catch (error) {
    console.error('getCampuses error:', error);
    sendError(res, 'Failed to fetch campuses', 500);
  }
}

export async function getCampuses(req: Request, res: Response): Promise<void> {
  await sendCampuses(req, res, false);
}

export async function getAdminCampuses(req: Request, res: Response): Promise<void> {
  await sendCampuses(req, res, true);
}

export async function getCampusById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const campus = await prisma.campus.findUnique({
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
      sendError(res, 'Campus not found', 404);
      return;
    }

    sendSuccess(res, {
      ...campus,
      listingCount: campus._count.listings,
    });
  } catch (error) {
    console.error('getCampusById error:', error);
    sendError(res, 'Failed to fetch campus', 500);
  }
}

export async function createCampus(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createCampusSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const { name, institutionId, location, address, isActive } = parsed.data;

    const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) {
      sendError(res, 'Selected institution does not exist', 404);
      return;
    }

    const coordinates = await resolveAddressCoordinates(address);

    const existing = await prisma.campus.findUnique({
      where: { name },
    });

    if (existing) {
      sendError(res, 'A campus with this name already exists', 409);
      return;
    }

    const campus = await prisma.campus.create({
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
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'CREATE_CAMPUS',
          targetType: 'CAMPUS',
          targetId: campus.id,
          description: `Created campus "${campus.name}".`,
        },
      });
    }

    sendSuccess(res, campus, 'Campus created successfully', 201);
  } catch (error) {
    console.error('createCampus error:', error);
    if (error instanceof GoogleMapsError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      sendError(res, 'A campus with this name already exists', 409);
      return;
    }
    sendError(res, 'Failed to create campus', 500);
  }
}

export async function updateCampus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.campus.findUnique({
      where: { id },
    });

    if (!existing) {
      sendError(res, 'Campus not found', 404);
      return;
    }

    const parsed = updateCampusSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    if (parsed.data.institutionId) {
      const institution = await prisma.institution.findUnique({ where: { id: parsed.data.institutionId } });
      if (!institution) {
        sendError(res, 'Selected institution does not exist', 404);
        return;
      }
    }

    const newAddress = parsed.data.address ?? existing.address;
    const coordinates = parsed.data.address
      ? await resolveAddressCoordinates(newAddress)
      : { latitude: existing.latitude, longitude: existing.longitude };
    const listings = parsed.data.address
      ? await prisma.listing.findMany({ where: { campusId: id }, select: { id: true, address: true } })
      : [];
    const listingDistances = await Promise.all(listings.map(async (listing) => ({
      id: listing.id,
      distanceFromCampus: await calculateGoogleRouteDistanceKm(listing.address, newAddress),
    })));

    const updated = await prisma.$transaction(async (tx) => {
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
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'UPDATE_CAMPUS',
          targetType: 'CAMPUS',
          targetId: id,
          description: `Updated campus "${updated.name}".`,
        },
      });
    }

    sendSuccess(res, updated, 'Campus updated successfully');
  } catch (error) {
    console.error('updateCampus error:', error);
    if (error instanceof GoogleMapsError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    sendError(res, 'Failed to update campus', 500);
  }
}

export async function toggleCampusStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.campus.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Campus not found', 404);
      return;
    }

    const parsed = toggleCampusStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const campus = await prisma.campus.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'CHANGE_CAMPUS_STATUS',
          targetType: 'CAMPUS',
          targetId: id,
          description: `Campus "${campus.name}" ${campus.isActive ? 'activated' : 'deactivated'}.`,
        },
      });
    }

    sendSuccess(
      res,
      campus,
      `Campus ${campus.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    console.error('toggleCampusStatus error:', error);
    sendError(res, 'Failed to toggle campus status', 500);
  }
}
