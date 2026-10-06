import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, 'Review comment must be at least 3 characters').max(1200),
});

export async function getListingReviews(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    if (listing.approvalStatus !== 'APPROVED') {
      sendError(res, 'Reviews are only available for approved listings.', 404);
      return;
    }

    const reviews = await prisma.review.findMany({
      where: { listingId: id },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(
      res,
      reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.user,
      }))
    );
  } catch (error) {
    console.error('getListingReviews error:', error);
    sendError(res, 'Failed to fetch reviews', 500);
  }
}

export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (req.user.role !== 'STUDENT') {
      sendError(res, 'Only students can submit reviews.', 403);
      return;
    }

    const { id } = req.params;
    const parsed = reviewSchema.safeParse(req.body);
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
      sendError(res, 'Only approved listings can be reviewed.', 400);
      return;
    }

    const existing = await prisma.review.findFirst({
      where: { userId: req.user.id, listingId: id },
    });

    if (existing) {
      sendError(res, 'You have already reviewed this listing.', 409);
      return;
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        listingId: id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    sendSuccess(
      res,
      {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.user,
      },
      'Review submitted successfully',
      201
    );
  } catch (error) {
    console.error('createReview error:', error);
    sendError(res, 'Failed to create review', 500);
  }
}
