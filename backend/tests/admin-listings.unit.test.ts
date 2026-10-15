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

describe('admin listing directory', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    [undefined, {}],
    ['ALL', {}],
    ['PENDING', { approvalStatus: 'PENDING' }],
    ['APPROVED', { approvalStatus: 'APPROVED' }],
    ['DRAFT', { approvalStatus: 'DRAFT' }],
    ['REJECTED', { approvalStatus: 'REJECTED' }],
  ])('returns listings filtered by status %s', async (status, where) => {
    const listings = [{ id: 'listing-1', title: 'Campus home', approvalStatus: status || 'PENDING' }];
    listingFindMany.mockResolvedValue(listings as never);
    const response = responseMock();

    await getAdminListings({ query: status ? { status } : {} } as unknown as Request, response);

    expect(listingFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where,
      orderBy: { createdAt: 'desc' },
      include: expect.objectContaining({ photos: true, campus: true }),
    }));
    expect((response.json as jest.Mock).mock.calls[0][0].data).toEqual(listings);
  });

  it('rejects an invalid status without querying Prisma', async () => {
    const response = responseMock();

    await getAdminListings({ query: { status: 'LIVE' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(listingFindMany).not.toHaveBeenCalled();
  });

  it('returns an explicit API error when the query fails', async () => {
    listingFindMany.mockRejectedValue(new Error('database unavailable'));
    const response = responseMock();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getAdminListings({ query: { status: 'ALL' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(500);
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
