import {
  CampusCatalogImporterDependencies,
  importCampusCatalog,
} from '../src/utils/campus-catalog-import';
import { LocationServiceError } from '../src/utils/geocode';

function createDependencies(
  overrides: Partial<CampusCatalogImporterDependencies> = {}
): CampusCatalogImporterDependencies {
  return {
    getActiveInstitutions: jest.fn().mockResolvedValue([{
      id: 'institution-1',
      name: 'Example University',
      shortName: 'EU',
    }]),
    getExistingCampusNames: jest.fn().mockResolvedValue(new Set<string>()),
    findCampusSuggestions: jest.fn().mockResolvedValue([{
      name: 'Example University Main Campus',
      address: 'University Road, Pretoria, Gauteng, South Africa',
      location: 'Pretoria, Gauteng',
    }]),
    resolveCoordinates: jest.fn().mockResolvedValue({
      latitude: -25.7479,
      longitude: 28.2293,
    }),
    createCampus: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('campus catalog import', () => {
  it('dry-runs resolved campuses without writing to the database', async () => {
    const dependencies = createDependencies();

    await expect(importCampusCatalog(dependencies, true)).resolves.toMatchObject([{
      institution: 'Example University',
      wouldCreate: ['Example University Main Campus'],
      created: [],
      alreadyExists: [],
      unresolved: [],
    }]);
    expect(dependencies.resolveCoordinates).toHaveBeenCalledWith(
      'University Road, Pretoria, Gauteng, South Africa',
      {
        locality: 'Pretoria, Gauteng',
        fallbackQuery: 'Example University Main Campus',
        label: 'campus',
      }
    );
    expect(dependencies.createCampus).not.toHaveBeenCalled();
  });

  it('creates active campuses linked to their institution and skips existing names', async () => {
    const existingNames = new Set(['existing campus']);
    const dependencies = createDependencies({
      getExistingCampusNames: jest.fn().mockResolvedValue(existingNames),
      findCampusSuggestions: jest.fn().mockResolvedValue([
        {
          name: 'Existing Campus',
          address: 'Existing Road, Pretoria, Gauteng, South Africa',
          location: 'Pretoria, Gauteng',
        },
        {
          name: 'New Campus',
          address: 'University Road, Pretoria, Gauteng, South Africa',
          location: 'Pretoria, Gauteng',
        },
      ]),
    });

    await expect(importCampusCatalog(dependencies, false)).resolves.toMatchObject([{
      created: ['New Campus'],
      alreadyExists: ['Existing Campus'],
    }]);
    expect(dependencies.createCampus).toHaveBeenCalledWith({
      name: 'New Campus',
      institutionId: 'institution-1',
      location: 'Pretoria, Gauteng',
      address: 'University Road, Pretoria, Gauteng, South Africa',
      latitude: -25.7479,
      longitude: 28.2293,
      isActive: true,
    });
  });

  it('reports unmapped and unresolved campuses without creating them', async () => {
    const dependencies = createDependencies({
      getActiveInstitutions: jest.fn().mockResolvedValue([
        { id: 'institution-1', name: 'Unmapped College', shortName: null },
        { id: 'institution-2', name: 'No Locality College', shortName: null },
        { id: 'institution-3', name: 'Unresolved College', shortName: null },
      ]),
      findCampusSuggestions: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{
          name: 'Campus without city',
          address: 'Campus Road, South Africa',
          location: 'South Africa',
        }])
        .mockResolvedValueOnce([{
          name: 'Unresolved Campus',
          address: 'Unknown Road, South Africa',
          location: 'Pretoria, Gauteng',
        }]),
      resolveCoordinates: jest.fn().mockRejectedValue(
        new LocationServiceError('Address could not be resolved.', 422)
      ),
    });

    await expect(importCampusCatalog(dependencies, false)).resolves.toMatchObject([
      { institution: 'Unmapped College', unmapped: true },
      { institution: 'No Locality College', unresolved: ['Campus without city'] },
      { institution: 'Unresolved College', unresolved: ['Unresolved Campus'] },
    ]);
    expect(dependencies.createCampus).not.toHaveBeenCalled();
  });

  it('surfaces temporary geocoding failures instead of treating them as no match', async () => {
    const dependencies = createDependencies({
      resolveCoordinates: jest.fn().mockRejectedValue(
        new LocationServiceError('OpenStreetMap address lookup is unavailable.', 503)
      ),
    });

    await expect(importCampusCatalog(dependencies, false)).rejects.toThrow(/unavailable/i);
    expect(dependencies.createCampus).not.toHaveBeenCalled();
  });
});
