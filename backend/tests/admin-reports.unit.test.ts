import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: { report: { findMany: jest.fn() } },
}));

import prisma from '../src/config/prisma';
import { getAdminReports } from '../src/controllers/report.controller';

const findMany = prisma.report.findMany as jest.MockedFunction<typeof prisma.report.findMany>;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('admin report retrieval', () => {
  beforeEach(() => jest.clearAllMocks());

  it('selects only fields required by the report directory', async () => {
    findMany.mockResolvedValue([]);
    const response = responseMock();

    await getAdminReports({} as Request, response);

    expect(findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        listing: { select: { id: true, title: true, approvalStatus: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('surfaces a retrieval failure instead of returning an empty success', async () => {
    findMany.mockRejectedValue(new Error('database query failed'));
    const response = responseMock();
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getAdminReports({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to fetch reports',
    });
    expect(error).toHaveBeenCalledWith('getAdminReports error:', expect.any(Error));
  });
});
