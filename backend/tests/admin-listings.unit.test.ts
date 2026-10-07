import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    listing: { count: jest.fn(), findMany: jest.fn() },
    user: { count: jest.fn() },
    campus: { count: jest.fn() },
  },
}));

import prisma from '../src/config/prisma';
import { getAdminListings, getAdminStats } from '../src/controllers/admin.controller';

const listingFindMany = prisma.listing.findMany as jest.MockedFunction<typeof prisma.listing.findMany>;
const listingCount = prisma.listing.count as jest.MockedFunction<typeof prisma.listing.count>;
const userCount = prisma.user.count as jest.MockedFunction<typeof prisma.user.count>;
const campusCount = prisma.campus.count as jest.MockedFunction<typeof prisma.campus.count>;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function requestMock(query: Record<string, string>) {
  return { query } as unknown as Request;
}

describe('admin listing directory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all listings when no status filter is provided', async () => {
    listingFindMany.mockResolvedValue([]);
    const response = responseMock();

    await getAdminListings(requestMock({}), response);

    expect(listingFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('filters listings by approval status', async () => {
    listingFindMany.mockResolvedValue([]);
    const response = responseMock();

    await getAdminListings(requestMock({ status: 'APPROVED' }), response);

    expect(listingFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { approvalStatus: 'APPROVED' },
    }));
  });

  it('rejects invalid statuses before querying', async () => {
    const response = responseMock();

    await getAdminListings(requestMock({ status: 'LIVE' }), response);

    expect(listingFindMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it('reports counts for every listing status so totals reconcile', async () => {
    userCount.mockResolvedValue(0);
    campusCount.mockResolvedValue(0);
    listingCount
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    const response = responseMock();

    await getAdminStats({} as Request, response);

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        totalListings: 8,
        pendingListings: 0,
        approvedListings: 7,
        draftListings: 1,
        rejectedListings: 0,
      }),
    }));
  });
});
