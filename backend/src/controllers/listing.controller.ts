import { Request, Response } from 'express';
import prisma from '../config/prisma';
import {
  createListingSchema,
  updateListingSchema,
  listingSearchQuerySchema,
} from '../validators/listing.validator';
import { sendSuccess, sendError } from '../utils/response';
import { LocationServiceError, resolveListingLocation } from '../utils/geocode';
import { deleteStoredFile, storeUploadedFile } from '../utils/file-storage';
import { Prisma } from '@prisma/client';

export async function createListing(req: Request, res: Response): Promise<void> {
  const storedPhotos: Array<{ filename: string; mimetype: string }> = [];
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // Role verification
    if (req.user.role !== 'LANDLORD') {
      sendError(res, 'Only landlords can create accommodation listings.', 403);
      return;
    }

    // Verification check
    if (!req.user.isVerified) {
      sendError(res, 'Your landlord account must be verified before you can create a listing.', 403);
      return;
    }

    const parsed = createListingSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400, parsed.error.format());
      return;
    }

    const data = parsed.data;
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    if (uploadedFiles.length === 0) {
      sendError(res, 'Upload at least one property image before submitting this listing.', 400);
      return;
    }

    // Verify campus exists
    const campus = await prisma.campus.findUnique({
      where: { id: data.campusId },
      include: { institution: { select: { isActive: true } } },
    });

    if (!campus || !campus.isActive || !campus.institution?.isActive) {
      sendError(res, 'Selected campus is not available. Choose an active campus under an active institution.', 404);
      return;
    }

    for (const file of uploadedFiles) storedPhotos.push(await storeUploadedFile(file, true));
    const resolvedLocation = await resolveListingLocation(data.address, campus.address, {
      name: campus.name,
      locality: campus.location,
    });

    const listing = await prisma.listing.create({
      data: {
        ownerId: req.user.id,
        campusId: data.campusId,
        title: data.title,
        description: data.description,
        accommodationType: data.accommodationType,
        pricePerMonth: data.pricePerMonth,
        address: data.address,
        latitude: resolvedLocation.latitude,
        longitude: resolvedLocation.longitude,
        distanceFromCampus: resolvedLocation.distanceFromCampus,
        totalRooms: data.totalRooms,
        availableRooms: data.availableRooms,
        amenities: data.amenities,
        availabilityStatus: data.availabilityStatus || 'AVAILABLE',
        approvalStatus: 'PENDING',
        photos: {
          create: storedPhotos.map((photo, idx) => ({
            photoUrl: `/media/listings/${photo.filename}`,
            isPrimary: idx === 0,
          })),
        },
      },
      include: {
        photos: true,
        campus: true,
      },
    });

    sendSuccess(res, listing, 'Listing submitted successfully and awaiting admin approval', 201);
  } catch (error) {
    await Promise.allSettled(storedPhotos.map((photo) => deleteStoredFile(photo.filename)));
    console.error('createListing error:', error);
    if (error instanceof LocationServiceError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    if (error instanceof Error && error.message.includes('file content')) {
      sendError(res, error.message, 400);
      return;
    }
    sendError(res, 'Failed to create listing', 500);
  }
}

export async function getMyListings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const listings = await prisma.listing.findMany({
      where: { ownerId: req.user.id },
      include: {
        photos: true,
        campus: {
          select: { id: true, name: true, location: true },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: {
            reviews: true,
            favourites: true,
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = listings.map((l) => {
      const avgRating =
        l.reviews.length > 0
          ? Math.round((l.reviews.reduce((sum, r) => sum + r.rating, 0) / l.reviews.length) * 10) / 10
          : 0;

      return {
        id: l.id,
        title: l.title,
        description: l.description,
        accommodationType: l.accommodationType,
        pricePerMonth: l.pricePerMonth,
        address: l.address,
        latitude: l.latitude,
        longitude: l.longitude,
        distanceFromCampus: l.distanceFromCampus,
        totalRooms: l.totalRooms,
        availableRooms: l.availableRooms,
        amenities: l.amenities,
        availabilityStatus: l.availabilityStatus,
        approvalStatus: l.approvalStatus,
        rejectionReason: l.rejectionReason,
        campus: l.campus,
        photos: l.photos,
        primaryPhoto: l.photos.find((p) => p.isPrimary)?.photoUrl || l.photos[0]?.photoUrl || null,
        averageRating: avgRating,
        reviewCount: l._count.reviews,
        favouriteCount: l._count.favourites,
        conversationCount: l._count.conversations,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      };
    });

    // Summary stats
    const stats = {
      total: listings.length,
      approved: listings.filter((l) => l.approvalStatus === 'APPROVED').length,
      pending: listings.filter((l) => l.approvalStatus === 'PENDING').length,
      rejected: listings.filter((l) => l.approvalStatus === 'REJECTED').length,
      draft: listings.filter((l) => l.approvalStatus === 'DRAFT').length,
      totalRooms: listings.reduce((sum, l) => sum + l.totalRooms, 0),
      availableRooms: listings.reduce((sum, l) => sum + l.availableRooms, 0),
      availableRoomsByType: listings.reduce<Record<string, number>>((counts, listing) => {
        const accommodationType = listing.accommodationType;
        counts[accommodationType] = (counts[accommodationType] ?? 0) + listing.availableRooms;
        return counts;
      }, {}),
    };

    sendSuccess(res, { items: formatted, stats });
  } catch (error) {
    console.error('getMyListings error:', error);
    sendError(res, 'Failed to fetch landlord listings', 500);
  }
}

export async function getPublicListings(req: Request, res: Response): Promise<void> {
  try {
    const parsed = listingSearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const {
      institutionId,
      campusId,
      search,
      minPrice,
      maxPrice,
      maxDistance,
      type,
      availability,
      amenities,
      minRating,
      sort,
      page,
      limit,
    } = parsed.data;

    // Base condition: ONLY APPROVED listings are visible publicly
    const where: Prisma.ListingWhereInput = {
      approvalStatus: 'APPROVED',
    };

    if (campusId) {
      where.campusId = campusId;
    }

    if (institutionId) {
      where.campus = { institutionId };
    }

    if (type) {
      where.accommodationType = type;
    }

    if (availability) {
      where.availabilityStatus = availability;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerMonth = {};
      if (minPrice !== undefined) where.pricePerMonth.gte = minPrice;
      if (maxPrice !== undefined) where.pricePerMonth.lte = maxPrice;
    }

    if (maxDistance !== undefined) {
      where.distanceFromCampus = { lte: maxDistance };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (amenities) {
      const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
      if (amenityArray.length > 0) {
        where.amenities = { hasEvery: amenityArray };
      }
    }

    // Determine sorting
    let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { pricePerMonth: 'asc' };
    else if (sort === 'price-desc') orderBy = { pricePerMonth: 'desc' };
    else if (sort === 'nearest') orderBy = { distanceFromCampus: 'asc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };

    // Fetch listings with relations
    const [rawListings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          campus: { select: { id: true, name: true, location: true } },
          photos: true,
          owner: { select: { id: true, name: true, isVerified: true } },
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    // Format results with average rating
    let items = rawListings.map((l) => {
      const avgRating =
        l.reviews.length > 0
          ? Math.round((l.reviews.reduce((sum, r) => sum + r.rating, 0) / l.reviews.length) * 10) / 10
          : 0;

      return {
        id: l.id,
        title: l.title,
        description: l.description,
        accommodationType: l.accommodationType,
        pricePerMonth: l.pricePerMonth,
        address: l.address,
        latitude: l.latitude,
        longitude: l.longitude,
        distanceFromCampus: l.distanceFromCampus,
        totalRooms: l.totalRooms,
        availableRooms: l.availableRooms,
        amenities: l.amenities,
        availabilityStatus: l.availabilityStatus,
        approvalStatus: l.approvalStatus,
        campus: l.campus,
        photos: l.photos,
        primaryPhoto: l.photos.find((p) => p.isPrimary)?.photoUrl || l.photos[0]?.photoUrl || null,
        provider: {
          id: l.owner.id,
          name: l.owner.name,
          isVerified: l.owner.isVerified,
        },
        averageRating: avgRating,
        reviewCount: l.reviews.length,
        createdAt: l.createdAt,
      };
    });

    // Rating filter if requested
    if (minRating !== undefined && minRating > 0) {
      items = items.filter((item) => item.averageRating >= minRating);
    }

    // Sort by rating if requested
    if (sort === 'highest-rated') {
      items.sort((a, b) => b.averageRating - a.averageRating);
    }

    sendSuccess(res, {
      items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    console.error('getPublicListings error:', error);
    sendError(res, 'Failed to search listings', 500);
  }
}

export async function getListingById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        campus: true,
        photos: { orderBy: { createdAt: 'asc' } },
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
        reviews: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    if (listing.approvalStatus !== 'APPROVED') {
      const isOwner = req.user?.id === listing.ownerId;
      const isAdmin = req.user?.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        sendError(res, 'This listing is not currently publicly available', 403);
        return;
      }
    }

    const avgRating =
      listing.reviews.length > 0
        ? Math.round((listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length) * 10) / 10
        : 0;

    sendSuccess(res, {
      ...listing,
      averageRating: avgRating,
      reviewCount: listing.reviews.length,
      primaryPhoto: listing.photos.find((p) => p.isPrimary)?.photoUrl || listing.photos[0]?.photoUrl || null,
    });
  } catch (error) {
    console.error('getListingById error:', error);
    sendError(res, 'Failed to fetch listing details', 500);
  }
}

export async function updateListing(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;

    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { campus: true },
    });

    if (!existing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    // Ownership check: only the owner landlord can edit
    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      sendError(res, 'Forbidden: You can only modify your own listings', 403);
      return;
    }

    const parsed = updateListingSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const data = parsed.data;

    let distanceFromCampus = existing.distanceFromCampus;
    const targetCampusId = data.campusId || existing.campusId;
    let coordinates = { latitude: existing.latitude, longitude: existing.longitude };
    if (data.campusId !== undefined || data.address !== undefined) {
      const campus = await prisma.campus.findUnique({
        where: { id: targetCampusId },
        include: { institution: { select: { isActive: true } } },
      });
      if (!campus || !campus.isActive || !campus.institution?.isActive) {
        sendError(res, 'Selected campus is not available. Choose an active campus under an active institution.', 404);
        return;
      }
      const location = await resolveListingLocation(data.address ?? existing.address, campus.address);
      coordinates = { latitude: location.latitude, longitude: location.longitude };
      distanceFromCampus = location.distanceFromCampus;
    }

    // If listing was rejected, reset to PENDING on edit
    const newApprovalStatus =
      existing.approvalStatus === 'REJECTED' ? 'PENDING' : existing.approvalStatus;

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.campusId && { campusId: data.campusId }),
        ...(data.accommodationType && { accommodationType: data.accommodationType }),
        ...(data.pricePerMonth !== undefined && { pricePerMonth: data.pricePerMonth }),
        ...(data.address && { address: data.address }),
        ...(data.address || data.campusId ? coordinates : {}),
        distanceFromCampus,
        ...(data.totalRooms !== undefined && { totalRooms: data.totalRooms }),
        ...(data.availableRooms !== undefined && { availableRooms: data.availableRooms }),
        ...(data.amenities && { amenities: data.amenities }),
        ...(data.availabilityStatus && { availabilityStatus: data.availabilityStatus }),
        approvalStatus: newApprovalStatus,
        rejectionReason: existing.approvalStatus === 'REJECTED' ? null : existing.rejectionReason,
      },
      include: {
        photos: true,
        campus: true,
      },
    });

    sendSuccess(res, updated, 'Listing updated successfully');
  } catch (error) {
    console.error('updateListing error:', error);
    if (error instanceof LocationServiceError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    sendError(res, 'Failed to update listing', 500);
  }
}

export async function deleteListing(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;

    const existing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    // Ownership check
    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      sendError(res, 'Forbidden: You can only delete your own listings', 403);
      return;
    }

    await prisma.listing.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Listing deleted successfully');
  } catch (error) {
    console.error('deleteListing error:', error);
    sendError(res, 'Failed to delete listing', 500);
  }
}
