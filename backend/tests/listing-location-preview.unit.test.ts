import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    campus: { findUnique: jest.fn() },
  },
}));

jest.mock('../src/utils/geocode', () => {
  const actual = jest.requireActual('../src/utils/geocode');
  return {
    ...actual,
    resolveListingRoutePreview: jest.fn(),
  };
});

import prisma from '../src/config/prisma';
import { previewListingLocation } from '../src/controllers/listing.controller';
import { LocationServiceError, resolveListingRoutePreview } from '../src/utils/geocode';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function requestMock(body: unknown, user?: unknown): Request {
  return { body, user } as unknown as Request;
}

describe('Landlord listing route preview', () => {
  const findCampus = prisma.campus.findUnique as jest.Mock;
  const resolveRoutePreview = resolveListingRoutePreview as jest.MockedFunction<typeof resolveListingRoutePreview>;
  const campus = {
    id: 'campus-id',
    name: 'Example Campus',
    address: 'Campus Road, Pretoria',
    location: 'Pretoria, Gauteng',
    isActive: true,
    institution: { isActive: true },
  };
  const verifiedLandlord = { id: 'landlord-id', role: 'LANDLORD', isVerified: true };

  beforeEach(() => {
    findCampus.mockResolvedValue(campus);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns the server-calculated route and does not create a listing', async () => {
    const routePreview = {
      latitude: -25.75,
      longitude: 28.2,
      campusCoordinates: { latitude: -25.76, longitude: 28.21 },
      distanceFromCampus: 4.25,
      routeGeometry: {
        type: 'LineString' as const,
        coordinates: [[28.2, -25.75], [28.21, -25.76]] as Array<[number, number]>,
      },
    };
    resolveRoutePreview.mockResolvedValue(routePreview);
    const response = responseMock();

    await previewListingLocation(requestMock({
      campusId: 'campus-id',
      address: '10 Main Road, Pretoria',
    }, verifiedLandlord), response);

    expect(findCampus).toHaveBeenCalledWith({
      where: { id: 'campus-id' },
      include: { institution: { select: { isActive: true } } },
    });
    expect(resolveRoutePreview).toHaveBeenCalledWith(
      '10 Main Road, Pretoria',
      'Campus Road, Pretoria',
      { name: 'Example Campus', locality: 'Pretoria, Gauteng' }
    );
    expect((response.json as jest.Mock).mock.calls[0][0].data).toEqual(routePreview);
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('rejects invalid input before looking up a campus or calling the route provider', async () => {
    const response = responseMock();

    await previewListingLocation(requestMock({ campusId: 'campus-id', address: '  ' }, verifiedLandlord), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(findCampus).not.toHaveBeenCalled();
    expect(resolveRoutePreview).not.toHaveBeenCalled();
  });

  it.each([
    ['unauthenticated', undefined, 401],
    ['a student', { id: 'student-id', role: 'STUDENT', isVerified: true }, 403],
    ['an unverified landlord', { id: 'landlord-id', role: 'LANDLORD', isVerified: false }, 403],
  ])('rejects %s requests', async (_label, user, statusCode) => {
    const response = responseMock();

    await previewListingLocation(requestMock({
      campusId: 'campus-id',
      address: '10 Main Road, Pretoria',
    }, user), response);

    expect(response.status).toHaveBeenCalledWith(statusCode);
    expect(findCampus).not.toHaveBeenCalled();
    expect(resolveRoutePreview).not.toHaveBeenCalled();
  });

  it('rejects an inactive campus without calling the route provider', async () => {
    findCampus.mockResolvedValue({ ...campus, institution: { isActive: false } });
    const response = responseMock();

    await previewListingLocation(requestMock({
      campusId: 'campus-id',
      address: '10 Main Road, Pretoria',
    }, verifiedLandlord), response);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(resolveRoutePreview).not.toHaveBeenCalled();
  });

  it('returns route provider errors using the API error response', async () => {
    resolveRoutePreview.mockRejectedValue(
      new LocationServiceError('OpenStreetMap route calculation is temporarily unavailable. Try again later.', 503)
    );
    const response = responseMock();

    await previewListingLocation(requestMock({
      campusId: 'campus-id',
      address: '10 Main Road, Pretoria',
    }, verifiedLandlord), response);

    expect(response.status).toHaveBeenCalledWith(503);
    expect((response.json as jest.Mock).mock.calls[0][0].message)
      .toMatch(/route calculation is temporarily unavailable/i);
  });
});
