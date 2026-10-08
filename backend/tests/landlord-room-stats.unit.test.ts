import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: { listing: { findMany: jest.fn() } },
}));

import prisma from '../src/config/prisma';
import { getMyListings } from '../src/controllers/listing.controller';

const findMany = prisma.listing.findMany as jest.MockedFunction<typeof prisma.listing.findMany>;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function listing(accommodationType: string, availableRooms: number) {
  return {
    id: `${accommodationType}-${availableRooms}`,
    title: 'Campus rooms',
    description: 'Rooms near campus',
    accommodationType,
    pricePerMonth: 3000,
    address: '10 Main Road',
    latitude: -25.7,
    longitude: 28.2,
    distanceFromCampus: 2,
    totalRooms: availableRooms + 1,
    availableRooms,
    amenities: [],
    availabilityStatus: 'AVAILABLE',
    approvalStatus: 'PENDING',
    rejectionReason: null,
    campus: { id: 'campus-1', name: 'Main Campus', location: 'Pretoria' },
    photos: [],
    reviews: [],
    _count: { reviews: 0, favourites: 0, conversations: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('landlord available room statistics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('aggregates available rooms by accommodation type across owned listings', async () => {
    findMany.mockResolvedValue([
      listing('SHARED_ROOM', 9),
      listing('ROOM', 12),
      listing('SHARED_ROOM', 3),
    ] as never);
    const response = responseMock();
    const req = {
      user: { id: 'landlord-1', email: 'landlord@example.test', name: 'Landlord', role: 'LANDLORD', isVerified: true },
    } as unknown as Request;

    await getMyListings(req, response);

    const payload = (response.json as jest.Mock).mock.calls[0][0];
    expect(payload.data.stats.availableRoomsByType).toEqual({ SHARED_ROOM: 12, ROOM: 12 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: 'landlord-1' } }));
  });
});
