import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    institution: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

import prisma from '../src/config/prisma';
import { createInstitution } from '../src/controllers/campus.controller';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('Create institution with optional logo storage', () => {
  const queryRaw = prisma.$queryRaw as jest.Mock;
  const createInstitutionRecord = prisma.institution.create as jest.Mock;
  const createAuditLog = prisma.auditLog.create as jest.Mock;
  const request = (body: unknown) => ({
    body,
    user: { id: 'admin-id', role: 'ADMIN' },
  }) as unknown as Request;

  beforeEach(() => {
    jest.clearAllMocks();
    queryRaw.mockResolvedValue([{ available: false }]);
    createAuditLog.mockResolvedValue({});
  });

  it('creates without referencing the absent logo column and returns logoUrl null', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    createInstitutionRecord.mockResolvedValue({
      id: 'institution-id',
      name: 'Example University',
      shortName: null,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    });
    const response = responseMock();

    await createInstitution(request({
      name: 'Example University',
      shortName: null,
      logoUrl: null,
    }), response);

    expect(createInstitutionRecord).toHaveBeenCalledWith({
      data: {
        name: 'Example University',
        shortName: null,
        isActive: undefined,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-id',
        action: 'CREATE_INSTITUTION',
        targetType: 'INSTITUTION',
        targetId: 'institution-id',
        description: 'Created institution "Example University".',
      },
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      data: {
        id: 'institution-id',
        logoUrl: null,
      },
    });
  });

  it('returns an actionable error when a logo is submitted without logo storage', async () => {
    const response = responseMock();

    await createInstitution(request({
      name: 'Example University',
      logoUrl: 'https://example.edu/logo.png',
    }), response);

    expect(createInstitutionRecord).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(503);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: false,
      message: 'Institution logo storage is unavailable. Apply the institution logo database migration before adding a logo.',
    });
  });

  it('uses the normal Prisma create path when logo storage is available', async () => {
    queryRaw.mockResolvedValue([{ available: true }]);
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    createInstitutionRecord.mockResolvedValue({
      id: 'institution-id',
      name: 'Example University',
      shortName: 'EU',
      logoUrl: 'https://example.edu/logo.png',
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    });
    const response = responseMock();

    await createInstitution(request({
      name: 'Example University',
      shortName: 'EU',
      logoUrl: 'https://example.edu/logo.png',
    }), response);

    expect(createInstitutionRecord).toHaveBeenCalledWith({
      data: {
        name: 'Example University',
        shortName: 'EU',
        logoUrl: 'https://example.edu/logo.png',
      },
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      data: { logoUrl: 'https://example.edu/logo.png' },
    });
  });
});
