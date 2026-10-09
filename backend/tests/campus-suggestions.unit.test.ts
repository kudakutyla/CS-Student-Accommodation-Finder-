import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    institution: { findUnique: jest.fn() },
  },
}));

jest.mock('../src/utils/geocode', () => {
  const actual = jest.requireActual('../src/utils/geocode');
  return { ...actual, searchInstitutionCampuses: jest.fn() };
});

import prisma from '../src/config/prisma';
import { getCampusSuggestions } from '../src/controllers/campus.controller';
import { LocationServiceError, searchInstitutionCampuses } from '../src/utils/geocode';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('Admin campus suggestions', () => {
  const findInstitution = prisma.institution.findUnique as jest.Mock;
  const searchCampuses = searchInstitutionCampuses as jest.MockedFunction<typeof searchInstitutionCampuses>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns all suggestions for the selected active institution', async () => {
    findInstitution.mockResolvedValue({ id: 'd76ead4a-ca92-4c05-8114-7d365ad957a9', name: 'Sol Plaatje University', shortName: 'SPU', isActive: true });
    searchCampuses.mockResolvedValue([{
      name: 'Sol Plaatje University (North Campus)',
      address: 'Sol Plaatje Drive, Kimberley, South Africa',
      location: 'Kimberley, Northern Cape',
    }, {
      name: 'Sol Plaatje University (South Campus)',
      address: 'Main Road, Kimberley, South Africa',
      location: 'Kimberley, Northern Cape',
    }]);
    const response = responseMock();

    await getCampusSuggestions({
      query: { institutionId: 'd76ead4a-ca92-4c05-8114-7d365ad957a9' },
    } as unknown as Request, response);

    expect(searchCampuses).toHaveBeenCalledWith('Sol Plaatje University', 'SPU');
    expect((response.json as jest.Mock).mock.calls[0][0].data).toHaveLength(2);
  });

  it('rejects invalid input before querying the institution or provider', async () => {
    const response = responseMock();

    await getCampusSuggestions({
      query: { institutionId: 'not-an-id' },
    } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(findInstitution).not.toHaveBeenCalled();
    expect(searchCampuses).not.toHaveBeenCalled();
  });

  it('requires an active institution', async () => {
    findInstitution.mockResolvedValue({ id: 'd76ead4a-ca92-4c05-8114-7d365ad957a9', name: 'Inactive University', isActive: false });
    const response = responseMock();

    await getCampusSuggestions({
      query: { institutionId: 'd76ead4a-ca92-4c05-8114-7d365ad957a9' },
    } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(searchCampuses).not.toHaveBeenCalled();
  });

  it('returns a clear service error when OpenStreetMap is unavailable', async () => {
    findInstitution.mockResolvedValue({ id: 'd76ead4a-ca92-4c05-8114-7d365ad957a9', name: 'Sol Plaatje University', isActive: true });
    searchCampuses.mockRejectedValue(new LocationServiceError('OpenStreetMap campus search is busy or temporarily unavailable. Try again later.', 503));
    const response = responseMock();

    await getCampusSuggestions({
      query: { institutionId: 'd76ead4a-ca92-4c05-8114-7d365ad957a9' },
    } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
  });
});
