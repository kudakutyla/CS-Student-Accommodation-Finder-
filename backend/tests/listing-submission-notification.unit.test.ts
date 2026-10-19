import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    campus: { findUnique: jest.fn() },
    listing: { create: jest.fn() },
    user: { findMany: jest.fn() },
    notification: { createMany: jest.fn() },
  },
}));

jest.mock('../src/utils/geocode', () => ({
  LocationServiceError: class LocationServiceError extends Error {
    constructor(message: string, readonly statusCode: number) {
      super(message);
    }
  },
  resolveListingLocation: jest.fn().mockResolvedValue({
    latitude: -25.75,
    longitude: 28.2,
    distanceFromCampus: 2.5,
  }),
  resolveListingRoutePreview: jest.fn(),
}));

jest.mock('../src/utils/file-storage', () => ({
  storeUploadedFile: jest.fn().mockResolvedValue({ filename: 'listing-photo.jpg' }),
  deleteStoredFile: jest.fn().mockResolvedValue(undefined),
}));

import prisma from '../src/config/prisma';
import { createListing } from '../src/controllers/listing.controller';
import { storeUploadedFile } from '../src/utils/file-storage';
import { resolveListingLocation } from '../src/utils/geocode';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function requestMock(): Request {
  return {
    user: { id: 'landlord-id', role: 'LANDLORD', isVerified: true },
    body: {
      title: 'Student accommodation',
      description: 'A comfortable place near campus.',
      campusId: 'campus-id',
      accommodationType: 'ROOM',
      pricePerMonth: '3500',
      address: '10 Main Road, Pretoria',
      totalRooms: '2',
      availableRooms: '1',
      amenities: '[]',
    },
    files: [{
      originalname: 'room.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('image'),
    }],
  } as unknown as Request;
}

describe('Pending-listing admin notifications', () => {
  const findCampus = prisma.campus.findUnique as jest.Mock;
  const createListingRecord = prisma.listing.create as jest.Mock;
  const findAdmins = prisma.user.findMany as jest.Mock;
  const createNotifications = prisma.notification.createMany as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    findCampus.mockResolvedValue({
      id: 'campus-id',
      name: 'Example Campus',
      address: 'Campus Road, Pretoria',
      location: 'Pretoria, Gauteng',
      isActive: true,
      institution: { isActive: true },
    });
    createListingRecord.mockResolvedValue({
      id: 'listing-id',
      title: 'Student accommodation',
    });
    findAdmins.mockResolvedValue([{ id: 'admin-id' }]);
    createNotifications.mockResolvedValue({ count: 1 });
    (storeUploadedFile as jest.Mock).mockResolvedValue({ filename: 'listing-photo.jpg', mimetype: 'image/jpeg' });
    (resolveListingLocation as jest.Mock).mockResolvedValue({
      latitude: -25.75,
      longitude: 28.2,
      distanceFromCampus: 2.5,
    });
  });

  it('notifies active admins with the pending listing target', async () => {
    const response = responseMock();

    await createListing(requestMock(), response);

    expect(findAdmins).toHaveBeenCalledWith({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    expect(createNotifications).toHaveBeenCalledWith({
      data: [{
        userId: 'admin-id',
        listingId: 'listing-id',
        type: 'PENDING_LISTING',
        title: 'Listing awaiting review',
        message: '"Student accommodation" has been submitted and is awaiting admin approval.',
      }],
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      message: 'Listing submitted successfully and awaiting admin approval',
    });
  });

  it('keeps listing submission successful when admin notification creation fails', async () => {
    const notificationError = new Error('Notification table unavailable');
    createNotifications.mockRejectedValue(notificationError);
    const logError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = responseMock();

    await createListing(requestMock(), response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      message: 'Listing submitted successfully, but administrators could not be notified.',
      data: { id: 'listing-id' },
    });
    expect(logError).toHaveBeenCalledWith('createListing admin notification error:', notificationError);
    logError.mockRestore();
  });
});
