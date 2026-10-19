import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    campus: { count: jest.fn() },
    listing: { count: jest.fn() },
  },
}));

import prisma from '../src/config/prisma';
import { getPublicCampusStats } from '../src/controllers/campus.controller';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('Public campus and approved listing statistics', () => {
  const campusCount = prisma.campus.count as jest.Mock;
  const listingCount = prisma.listing.count as jest.Mock;

  beforeEach(() => jest.clearAllMocks());

  it('returns active campus and approved listing totals', async () => {
    campusCount.mockResolvedValue(19);
    listingCount.mockResolvedValue(29);
    const response = responseMock();

    await getPublicCampusStats({} as Request, response);

    expect(campusCount).toHaveBeenCalledWith({
      where: { isActive: true, institution: { is: { isActive: true } } },
    });
    expect(listingCount).toHaveBeenCalledWith({
      where: { approvalStatus: 'APPROVED' },
    });
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      data: { campusCount: 19, approvedListingCount: 29 },
    });
  });

  it('returns an explicit server error when a count query fails', async () => {
    campusCount.mockResolvedValue(19);
    listingCount.mockRejectedValue(new Error('database unavailable'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = responseMock();

    await getPublicCampusStats({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: false,
      message: 'Failed to fetch public accommodation statistics',
    });
  });
});
