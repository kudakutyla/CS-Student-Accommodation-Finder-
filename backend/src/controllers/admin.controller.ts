import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be at least 3 characters'),
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

    const updated = await prisma.listing.update({
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
    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'APPROVE_LISTING',
        targetType: 'LISTING',
        targetId: listing.id,
        description: `Admin approved listing "${listing.title}" by landlord ${listing.owner.name} (${listing.owner.email})`,
      },
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

    const updated = await prisma.listing.update({
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
    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'REJECT_LISTING',
        targetType: 'LISTING',
        targetId: listing.id,
        description: `Admin rejected listing "${listing.title}" by landlord ${listing.owner.name}. Reason: ${parsed.data.reason}`,
      },
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
      totalCampuses,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'LANDLORD' } }),
      prisma.user.count({ where: { role: 'LANDLORD', isVerified: true } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.listing.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.campus.count({ where: { isActive: true } }),
    ]);

    sendSuccess(res, {
      totalStudents,
      totalLandlords,
      verifiedLandlords,
      totalListings,
      pendingListings,
      approvedListings,
      totalCampuses,
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    sendError(res, 'Failed to fetch admin stats', 500);
  }
}
