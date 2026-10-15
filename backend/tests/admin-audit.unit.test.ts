import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: { auditLog: { findMany: jest.fn() } },
}));

import prisma from '../src/config/prisma';
import { getAdminAuditLogs } from '../src/controllers/admin.controller';

const mockedFindMany = prisma.auditLog.findMany as jest.MockedFunction<typeof prisma.auditLog.findMany>;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function requestMock(query: Record<string, string>): Request {
  return { query } as unknown as Request;
}

describe('admin audit query filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('applies category and inclusive date range filters in the database query', async () => {
    mockedFindMany.mockResolvedValue([]);
    const response = responseMock();

    await getAdminAuditLogs(requestMock({ from: '2026-10-01', to: '2026-10-06', targetType: 'REPORT' }), response);

    expect(mockedFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        targetType: 'REPORT',
        createdAt: {
          gte: new Date('2026-10-01T00:00:00.000Z'),
          lt: new Date('2026-10-07T00:00:00.000Z'),
        },
      },
    }));
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('rejects invalid calendar dates before querying', async () => {
    const response = responseMock();

    await getAdminAuditLogs(requestMock({ from: '2026-02-30' }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(mockedFindMany).not.toHaveBeenCalled();
  });
});
