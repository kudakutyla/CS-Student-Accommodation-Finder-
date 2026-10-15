import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export async function getMyFavourites(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (req.user.role !== 'STUDENT') {
      sendError(res, 'Only students can access favourites.', 403);
      return;
    }

    const favourites = await prisma.favourite.findMany({
      where: {
        userId: req.user.id,
        listing: { approvalStatus: 'APPROVED' },
      },
      include: {
        listing: {
          include: {
            campus: true,
            photos: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(
      res,
      favourites.map((entry) => ({
        id: entry.id,
        listingId: entry.listingId,
        createdAt: entry.createdAt,
        listing: entry.listing,
      }))
    );
  } catch (error) {
    console.error('getMyFavourites error:', error);
    sendError(res, 'Failed to fetch favourites', 500);
  }
}

export async function addFavourite(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (req.user.role !== 'STUDENT') {
      sendError(res, 'Only students can manage favourites.', 403);
      return;
    }

    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    if (listing.approvalStatus !== 'APPROVED') {
      sendError(res, 'Only approved listings can be added to favourites.', 400);
      return;
    }

    const favourite = await prisma.favourite.upsert({
      where: {
        userId_listingId: {
          userId: req.user.id,
          listingId: id,
        },
      },
      create: {
        userId: req.user.id,
        listingId: id,
      },
      update: {},
    });

    sendSuccess(
      res,
      {
        id: favourite.id,
        listingId: favourite.listingId,
        isFavourite: true,
      },
      'Listing added to favourites'
    );
  } catch (error) {
    console.error('addFavourite error:', error);
    sendError(res, 'Failed to update favourite', 500);
  }
}

export async function removeFavourite(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (req.user.role !== 'STUDENT') {
      sendError(res, 'Only students can manage favourites.', 403);
      return;
    }

    await prisma.favourite.deleteMany({
      where: { userId: req.user.id, listingId: req.params.id },
    });

    sendSuccess(res, { listingId: req.params.id, isFavourite: false }, 'Favourite removed');
  } catch (error) {
    console.error('removeFavourite error:', error);
    sendError(res, 'Failed to update favourite', 500);
  }
}
