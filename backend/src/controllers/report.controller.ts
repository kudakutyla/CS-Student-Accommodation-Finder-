import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const reportSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
});

const reportStatusSchema = z.object({
  status: z.enum(['IN_REVIEW', 'RESOLVED', 'DISMISSED']),
  adminReviewNote: z.string().trim().max(2000, 'Review note must be 2000 characters or fewer').optional().default(''),
});

export async function createReport(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    if (listing.approvalStatus !== 'APPROVED') {
      sendError(res, 'Only approved listings can be reported.', 400);
      return;
    }

    const report = await prisma.report.create({
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
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
      if (admins.length) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'NEW_REPORT',
            title: 'A listing was reported',
            message: `A student reported "${listing.title}" for ${parsed.data.reason}.`,
          })),
        });
      }
    } catch (error) {
      console.error('createReport admin notification error:', error);
      message = 'Report submitted successfully, but administrators could not be notified.';
    }

    sendSuccess(res, report, message, 201);
  } catch (error) {
    console.error('createReport error:', error);
    sendError(res, 'Failed to submit report', 500);
  }
}

export async function getAdminReports(_req: Request, res: Response): Promise<void> {
  try {
    const reports = await prisma.report.findMany({
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

    sendSuccess(res, reports);
  } catch (error) {
    console.error('getAdminReports error:', error);
    sendError(res, 'Failed to fetch reports', 500);
  }
}

export async function getMyReports(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const reports = await prisma.report.findMany({
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

    sendSuccess(res, reports);
  } catch (error) {
    console.error('getMyReports error:', error);
    sendError(res, 'Failed to fetch your reports', 500);
  }
}

export async function updateReportStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parsed = reportStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        userId: true,
        status: true,
        listing: { select: { title: true } },
      },
    });
    if (!report) {
      sendError(res, 'Report not found', 404);
      return;
    }
    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      sendError(res, 'This report has already been closed.', 409);
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const savedReport = await tx.report.update({
        where: { id: report.id },
        data: { status: parsed.data.status },
        select: { id: true, status: true, updatedAt: true },
      });
      await tx.auditLog.create({
        data: {
          adminId: req.user!.id,
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

    sendSuccess(res, updated, 'Report status updated');
  } catch (error) {
    console.error('updateReportStatus error:', error);
    sendError(res, 'Failed to update report status', 500);
  }
}
