import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const rejectSchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be at least 3 characters'),
});

const userUpdateSchema = z.object({
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => data.isVerified !== undefined || data.isActive !== undefined, {
  message: 'At least one account setting must be provided.',
});

export async function getPendingListings(req: Request, res: Response): Promise<void> {
  try {
    const pendingListings = await prisma.listing.findMany({
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

    sendSuccess(res, pendingListings);
  } catch (error) {
    console.error('getPendingListings error:', error);
    sendError(res, 'Failed to fetch pending listings', 500);
  }
}

export async function getAdminListings(req: Request, res: Response): Promise<void> {
  try {
    const filters = z.object({
      status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
    }).safeParse(req.query);
    if (!filters.success) {
      sendError(res, filters.error.errors[0].message, 400);
      return;
    }

    const listings = await prisma.listing.findMany({
      where: filters.data.status ? { approvalStatus: filters.data.status } : {},
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
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, listings);
  } catch (error) {
    console.error('getAdminListings error:', error);
    sendError(res, 'Failed to fetch admin listings', 500);
  }
}

export async function approveListing(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const savedListing = await tx.listing.update({
        where: { id },
        data: { approvalStatus: 'APPROVED', rejectionReason: null },
        include: { photos: true, campus: true },
      });
      await tx.auditLog.create({
        data: {
          adminId: req.user!.id,
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

    sendSuccess(res, updated, 'Listing approved successfully');
  } catch (error) {
    console.error('approveListing error:', error);
    sendError(res, 'Failed to approve listing', 500);
  }
}

export async function rejectListing(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;

    const parsed = rejectSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const savedListing = await tx.listing.update({
        where: { id },
        data: { approvalStatus: 'REJECTED', rejectionReason: parsed.data.reason },
        include: { photos: true, campus: true },
      });
      await tx.auditLog.create({
        data: {
          adminId: req.user!.id,
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

    sendSuccess(res, updated, 'Listing rejected');
  } catch (error) {
    console.error('rejectListing error:', error);
    sendError(res, 'Failed to reject listing', 500);
  }
}

export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  try {
    const [
      totalStudents,
      totalLandlords,
      verifiedLandlords,
      totalListings,
      pendingListings,
      approvedListings,
      draftListings,
      rejectedListings,
      totalCampuses,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'LANDLORD' } }),
      prisma.user.count({ where: { role: 'LANDLORD', isVerified: true } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.listing.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.listing.count({ where: { approvalStatus: 'DRAFT' } }),
      prisma.listing.count({ where: { approvalStatus: 'REJECTED' } }),
      prisma.campus.count({ where: { isActive: true } }),
    ]);

    sendSuccess(res, {
      totalStudents,
      totalLandlords,
      verifiedLandlords,
      totalListings,
      pendingListings,
      approvedListings,
      draftListings,
      rejectedListings,
      totalCampuses,
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    sendError(res, 'Failed to fetch admin stats', 500);
  }
}

export async function getAdminUsers(req: Request, res: Response): Promise<void> {
  try {
    const filters = z.object({
      role: z.enum(['STUDENT', 'LANDLORD']).optional(),
      verified: z.enum(['true', 'false']).optional(),
    }).safeParse(req.query);
    if (!filters.success) {
      sendError(res, filters.error.errors[0].message, 400);
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        role: filters.data.role ?? { in: ['STUDENT', 'LANDLORD'] },
        ...(filters.data.verified !== undefined
          ? { isVerified: filters.data.verified === 'true' }
          : {}),
      },
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
    sendSuccess(res, users);
  } catch (error) {
    console.error('getAdminUsers error:', error);
    sendError(res, 'Failed to fetch users', 500);
  }
}

export async function updateAdminUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target || target.role === 'ADMIN') {
      sendError(res, 'Managed user not found', 404);
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
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
          adminId: req.user!.id,
          action: 'UPDATE_USER_ACCOUNT',
          targetType: 'USER',
          targetId: target.id,
          description: `Admin updated account flags: ${JSON.stringify(parsed.data)}.`,
        },
      });
      return savedUser;
    });

    sendSuccess(res, updated, 'User account updated');
  } catch (error) {
    console.error('updateAdminUser error:', error);
    sendError(res, 'Failed to update user account', 500);
  }
}

export async function getAdminAuditLogs(_req: Request, res: Response): Promise<void> {
  try {
    const isCalendarDate = (value: string | undefined) => !value || (
      !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
      && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
    );
    const filterSchema = z.object({
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      targetType: z.enum(['USER', 'REPORT', 'LISTING', 'CAMPUS', 'INSTITUTION', 'SYSTEM']).optional(),
    }).refine((filters) => isCalendarDate(filters.from) && isCalendarDate(filters.to), {
      message: 'Enter valid calendar dates.',
    }).refine((filters) => !filters.from || !filters.to || filters.from <= filters.to, {
      message: 'Start date must be on or before end date.',
    });
    const parsed = filterSchema.safeParse(_req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const where: Prisma.AuditLogWhereInput = {};
    if (parsed.data.targetType) where.targetType = parsed.data.targetType;
    if (parsed.data.from || parsed.data.to) {
      where.createdAt = {};
      if (parsed.data.from) where.createdAt.gte = new Date(`${parsed.data.from}T00:00:00.000Z`);
      if (parsed.data.to) {
        const exclusiveEnd = new Date(`${parsed.data.to}T00:00:00.000Z`);
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
        where.createdAt.lt = exclusiveEnd;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: { admin: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    sendSuccess(res, logs);
  } catch (error) {
    console.error('getAdminAuditLogs error:', error);
    sendError(res, 'Failed to fetch audit history', 500);
  }
}
