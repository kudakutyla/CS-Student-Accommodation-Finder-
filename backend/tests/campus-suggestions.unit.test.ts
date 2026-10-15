import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    institution: { findUnique: jest.fn() },
    campus: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('../src/utils/geocode', () => {
  const actual = jest.requireActual('../src/utils/geocode');
  return {
    ...actual,
    resolveAddressCoordinates: jest.fn(),
    searchCampusAddressSuggestions: jest.fn(),
    searchInstitutionCampuses: jest.fn(),
  };
});

import prisma from '../src/config/prisma';
import {
  createCampus,
  getCampusAddressSuggestions,
  getCampusSuggestions,
} from '../src/controllers/campus.controller';
import {
  LocationServiceError,
  resolveAddressCoordinates,
  searchCampusAddressSuggestions,
  searchInstitutionCampuses,
} from '../src/utils/geocode';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('Admin campus suggestions', () => {
  const findInstitution = prisma.institution.findUnique as jest.Mock;
  const searchCampuses = searchInstitutionCampuses as jest.MockedFunction<typeof searchInstitutionCampuses>;
  const resolveCampusAddress = resolveAddressCoordinates as jest.MockedFunction<typeof resolveAddressCoordinates>;
  const searchAddressSuggestions = searchCampusAddressSuggestions as jest.MockedFunction<typeof searchCampusAddressSuggestions>;

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

  it('includes campus context when resolving a new campus address', async () => {
    findInstitution.mockResolvedValue({
      id: 'd76ead4a-ca92-4c05-8114-7d365ad957a9',
      name: 'Example University',
      isActive: true,
    });
    resolveCampusAddress.mockResolvedValue({ latitude: -25.7479, longitude: 28.2293 });
    (prisma.campus.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.campus.create as jest.Mock).mockResolvedValue({ id: 'campus-id', name: 'Example Campus' });
    const response = responseMock();

    await createCampus({
      body: {
        institutionId: 'd76ead4a-ca92-4c05-8114-7d365ad957a9',
        name: 'Example Campus',
        location: 'Pretoria, Gauteng',
        address: 'University Road, Pretoria, Gauteng',
      },
    } as unknown as Request, response);

    expect(resolveCampusAddress).toHaveBeenCalledWith('University Road, Pretoria, Gauteng', {
      locality: 'Pretoria, Gauteng',
      fallbackQuery: 'Example Campus',
      label: 'campus',
    });
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it('returns validated address suggestions using the entered campus context', async () => {
    searchAddressSuggestions.mockResolvedValue([{ address: 'University Road, Pretoria, Gauteng, South Africa' }]);
    const response = responseMock();

    await getCampusAddressSuggestions({
      query: {
        address: 'University Road',
        locality: 'Pretoria, Gauteng',
        campusName: 'Example Campus',
      },
    } as unknown as Request, response);

    expect(searchAddressSuggestions).toHaveBeenCalledWith(
      'University Road',
      'Pretoria, Gauteng',
      'Example Campus'
    );
    expect((response.json as jest.Mock).mock.calls[0][0].data).toEqual([
      { address: 'University Road, Pretoria, Gauteng, South Africa' },
    ]);
  });

  it('rejects invalid campus address suggestion parameters without calling Nominatim', async () => {
    const response = responseMock();

    await getCampusAddressSuggestions({
      query: { address: 'x', locality: '' },
    } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(searchAddressSuggestions).not.toHaveBeenCalled();
  });

  it('returns explicit address lookup service errors', async () => {
    searchAddressSuggestions.mockRejectedValue(
      new LocationServiceError('OpenStreetMap address lookup is busy or temporarily unavailable. Try again later.', 503)
    );
    const response = responseMock();

    await getCampusAddressSuggestions({
      query: { address: 'University Road', locality: 'Pretoria' },
    } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
  });
});
