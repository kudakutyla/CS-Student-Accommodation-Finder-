import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { createCampusSchema, updateCampusSchema, toggleCampusStatusSchema } from '../validators/campus.validator';
import { sendSuccess, sendError } from '../utils/response';
import { calculateHaversineDistance } from '../utils/distance';

export async function getCampuses(req: Request, res: Response): Promise<void> {
  try {
    const includeInactive = req.query.all === 'true' && req.user?.role === 'ADMIN';

    const campuses = await prisma.campus.findMany({
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

    sendSuccess(res, formatted);
  } catch (error) {
    console.error('getCampuses error:', error);
    sendError(res, 'Failed to fetch campuses', 500);
  }
}

export async function getCampusById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const campus = await prisma.campus.findUnique({
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

    const { name, location, address, latitude, longitude, isActive } = parsed.data;

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
        location,
        address,
        latitude,
        longitude,
        isActive: isActive ?? true,
      },
    });

    sendSuccess(res, campus, 'Campus created successfully', 201);
  } catch (error) {
    console.error('createCampus error:', error);
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

    const updated = await prisma.campus.update({
      where: { id },
      data: parsed.data,
    });

    // If coordinates changed, recompute distance for associated listings
    if (
      (parsed.data.latitude !== undefined && parsed.data.latitude !== existing.latitude) ||
      (parsed.data.longitude !== undefined && parsed.data.longitude !== existing.longitude)
    ) {
      const listings = await prisma.listing.findMany({
        where: { campusId: id },
        select: { id: true, latitude: true, longitude: true },
      });

      for (const listing of listings) {
        const newDist = calculateHaversineDistance(
          listing.latitude,
          listing.longitude,
          updated.latitude,
          updated.longitude
        );
        await prisma.listing.update({
          where: { id: listing.id },
          data: { distanceFromCampus: newDist },
        });
      }
    }

    sendSuccess(res, updated, 'Campus updated successfully');
  } catch (error) {
    console.error('updateCampus error:', error);
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
