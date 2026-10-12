import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: { user: { findMany: jest.fn() } },
}));

import prisma from '../src/config/prisma';
import { getAdminUsers } from '../src/controllers/admin.controller';

const findMany = prisma.user.findMany as jest.MockedFunction<typeof prisma.user.findMany>;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function requestMock(query: Record<string, string>) {
  return { query } as unknown as Request;
}

describe('admin user directory filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters the user directory to students', async () => {
    findMany.mockResolvedValue([]);
    const response = responseMock();

    await getAdminUsers(requestMock({ role: 'STUDENT' }), response);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { role: 'STUDENT' },
    }));
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('filters landlords to verified accounts when requested', async () => {
    findMany.mockResolvedValue([]);
    const response = responseMock();

    await getAdminUsers(requestMock({ role: 'LANDLORD', verified: 'true' }), response);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { role: 'LANDLORD', isVerified: true },
    }));
  });

  it('rejects invalid roles before querying', async () => {
    const response = responseMock();

    await getAdminUsers(requestMock({ role: 'ADMIN' }), response);

    expect(findMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
  });
});
