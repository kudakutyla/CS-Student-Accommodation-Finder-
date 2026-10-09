import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    listing: { findMany: jest.fn() },
  },
}));

import prisma from '../src/config/prisma';
import { getAdminListings } from '../src/controllers/admin.controller';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('Admin dashboard listing results', () => {
  const findMany = prisma.listing.findMany as jest.Mock;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    ['ALL', {}],
    ['PENDING', { approvalStatus: 'PENDING' }],
    ['APPROVED', { approvalStatus: 'APPROVED' }],
  ])('returns listings filtered by %s approval status', async (status, where) => {
    const listings = [{ id: 'listing-1', title: 'Campus home', approvalStatus: status }];
    findMany.mockResolvedValue(listings);
    const response = responseMock();

    await getAdminListings({ query: { status } } as unknown as Request, response);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where,
      orderBy: { createdAt: 'desc' },
      include: expect.objectContaining({
        photos: true,
        campus: { select: { id: true, name: true, location: true } },
        owner: expect.objectContaining({ select: expect.objectContaining({ email: true }) }),
      }),
    }));
    expect((response.json as jest.Mock).mock.calls[0][0].data).toEqual(listings);
  });

  it('rejects an invalid status without querying Prisma', async () => {
    const response = responseMock();

    await getAdminListings({ query: { status: 'REJECTED' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('returns an explicit API error when the query fails', async () => {
    findMany.mockRejectedValue(new Error('database unavailable'));
    const response = responseMock();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getAdminListings({ query: { status: 'ALL' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(500);
  });
});
