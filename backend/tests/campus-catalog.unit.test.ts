import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    institution: { findMany: jest.fn() },
    campus: { findMany: jest.fn() },
  },
}));

import prisma from '../src/config/prisma';
import { getCampuses, getInstitutions } from '../src/controllers/campus.controller';

const queryRaw = prisma.$queryRaw as jest.Mock;
const institutionFindMany = prisma.institution.findMany as jest.Mock;
const campusFindMany = prisma.campus.findMany as jest.Mock;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('campus catalog endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryRaw.mockResolvedValue([{ available: false }]);
  });

  it('returns institutions when the optional logo column is absent', async () => {
    institutionFindMany.mockResolvedValue([{
      id: 'institution-1',
      name: 'Example University',
      shortName: 'EU',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      _count: { campuses: 2 },
    }]);
    const response = responseMock();

    await getInstitutions({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect((response.json as jest.Mock).mock.calls[0][0].data[0].logoUrl).toBeNull();
    expect(institutionFindMany.mock.calls[0][0].select).not.toHaveProperty('logoUrl');
  });

  it('returns campuses when the optional logo column is absent', async () => {
    campusFindMany.mockResolvedValue([{
      id: 'campus-1',
      institutionId: 'institution-1',
      institution: {
        id: 'institution-1',
        name: 'Example University',
        shortName: 'EU',
      },
      name: 'Main Campus',
      location: 'Example City',
      address: '1 University Road',
      latitude: -26,
      longitude: 28,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      _count: { listings: 3 },
    }]);
    const response = responseMock();

    await getCampuses({ query: {} } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(campusFindMany.mock.calls[0][0].select.institution.select).not.toHaveProperty('logoUrl');
    expect((response.json as jest.Mock).mock.calls[0][0].data[0].institution.logoUrl).toBeNull();
  });

  it('returns campus choices and institution logos when the logo column is present', async () => {
    queryRaw.mockResolvedValue([{ available: true }]);
    campusFindMany.mockResolvedValue([{
      id: 'campus-1',
      institutionId: 'institution-1',
      institution: {
        id: 'institution-1',
        name: 'Example University',
        shortName: 'EU',
        logoUrl: 'https://example.edu/logo.png',
      },
      name: 'Main Campus',
      location: 'Example City',
      address: '1 University Road',
      latitude: -26,
      longitude: 28,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      _count: { listings: 3 },
    }]);
    const response = responseMock();

    await getCampuses({ query: {} } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(campusFindMany.mock.calls[0][0].select.institution.select.logoUrl).toBe(true);
    expect((response.json as jest.Mock).mock.calls[0][0].data[0].institution.logoUrl)
      .toBe('https://example.edu/logo.png');
  });

  it('reports schema-inspection failures instead of hiding them as an empty catalog', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    queryRaw.mockRejectedValue(new Error('metadata query failed'));
    const response = responseMock();

    await getInstitutions({} as Request, response);

    expect(institutionFindMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(500);
    expect((response.json as jest.Mock).mock.calls[0][0].success).toBe(false);
    errorLog.mockRestore();
  });
});
