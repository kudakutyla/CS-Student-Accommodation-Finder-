import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    report: { findMany: jest.fn() },
  },
}));

import prisma from '../src/config/prisma';
import { getMyReports } from '../src/controllers/report.controller';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('Student report history', () => {
  const findReports = prisma.report.findMany as jest.Mock;

  afterEach(() => jest.resetAllMocks());

  it('returns only reports owned by the authenticated student', async () => {
    findReports.mockResolvedValue([{
      id: 'report-id',
      reason: 'Incorrect information',
      description: 'The address does not match the property.',
      status: 'PENDING',
      createdAt: new Date('2026-10-01T10:00:00Z'),
      updatedAt: new Date('2026-10-01T10:00:00Z'),
      listing: { id: 'listing-id', title: 'Student Apartment' },
    }]);
    const response = responseMock();

    await getMyReports({
      user: { id: 'student-id', email: 'student@example.com', role: 'STUDENT' },
    } as unknown as Request, response);

    expect(findReports).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'student-id' },
      orderBy: { createdAt: 'desc' },
      select: expect.objectContaining({
        id: true,
        reason: true,
        description: true,
        status: true,
        listing: { select: { id: true, title: true } },
      }),
    }));
    expect((response.json as jest.Mock).mock.calls[0][0].data).toHaveLength(1);
  });

  it('returns unauthorized when no user is attached to the request', async () => {
    const response = responseMock();

    await getMyReports({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(findReports).not.toHaveBeenCalled();
  });

  it('surfaces report lookup failures', async () => {
    findReports.mockRejectedValue(new Error('database unavailable'));
    const response = responseMock();

    await getMyReports({
      user: { id: 'student-id', email: 'student@example.com', role: 'STUDENT' },
    } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect((response.json as jest.Mock).mock.calls[0][0].message).toBe('Failed to fetch your reports');
  });
});
