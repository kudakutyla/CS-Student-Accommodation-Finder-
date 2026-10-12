import {
  DemoPropertyImportDependencies,
  demoLandlordEmail,
  demoPropertyTitle,
  importDemoProperties,
} from '../src/utils/demo-property-import';

const campus = {
  id: 'campus-1',
  name: 'Example Campus',
  location: 'Pretoria, Gauteng',
  address: 'Campus Road, Pretoria, Gauteng, South Africa',
  latitude: -25.75,
  longitude: 28.2,
};

const candidates = [1, 2, 3].map((number) => ({
  address: `${number} Example Street, Pretoria, Gauteng, South Africa`,
  latitude: -25.75 + number * 0.001,
  longitude: 28.2,
  distanceFromCampus: number * 0.4,
}));

function createDependencies(
  overrides: Partial<DemoPropertyImportDependencies> = {}
): DemoPropertyImportDependencies {
  return {
    getActiveCampuses: jest.fn().mockResolvedValue([campus]),
    findDemoLandlordId: jest.fn().mockResolvedValue(null),
    getExistingListings: jest.fn().mockResolvedValue([]),
    findNearbyProperties: jest.fn().mockResolvedValue(candidates),
    createDemoLandlord: jest.fn().mockResolvedValue('demo-landlord-1'),
    createDemoListing: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('demo property import', () => {
  it('dry-runs three verified nearby listings without writing records', async () => {
    const dependencies = createDependencies();

    await expect(importDemoProperties(dependencies, true)).resolves.toEqual([{
      campus: campus.name,
      existing: 0,
      available: 3,
      created: 0,
      wouldCreate: 3,
      unresolved: false,
    }]);
    expect(dependencies.findDemoLandlordId).toHaveBeenCalledWith(demoLandlordEmail(campus.id));
    expect(dependencies.createDemoLandlord).not.toHaveBeenCalled();
    expect(dependencies.createDemoListing).not.toHaveBeenCalled();
  });

  it('assigns three pending-demo listings to the same verified demo landlord', async () => {
    const dependencies = createDependencies();

    await expect(importDemoProperties(dependencies, false)).resolves.toEqual([{
      campus: campus.name,
      existing: 0,
      available: 3,
      created: 3,
      wouldCreate: 0,
      unresolved: false,
    }]);
    expect(dependencies.createDemoLandlord).toHaveBeenCalledTimes(1);
    expect(dependencies.createDemoListing).toHaveBeenCalledTimes(3);
    for (const [index, call] of (dependencies.createDemoListing as jest.Mock).mock.calls.entries()) {
      expect(call[0]).toMatchObject({
        ownerId: 'demo-landlord-1',
        campusId: campus.id,
        title: demoPropertyTitle(campus.name, index + 1),
        description: expect.stringContaining('fictional listing'),
        availabilityStatus: 'AVAILABLE',
        approvalStatus: 'PENDING',
      });
    }
  });

  it('skips already imported property slots on rerun', async () => {
    const dependencies = createDependencies({
      findDemoLandlordId: jest.fn().mockResolvedValue('demo-landlord-1'),
      getExistingListings: jest.fn().mockResolvedValue(candidates.map((candidate, index) => ({
        title: demoPropertyTitle(campus.name, index + 1),
        address: candidate.address,
      }))),
    });

    await expect(importDemoProperties(dependencies, false)).resolves.toEqual([{
      campus: campus.name,
      existing: 3,
      available: 0,
      created: 0,
      wouldCreate: 0,
      unresolved: false,
    }]);
    expect(dependencies.findNearbyProperties).not.toHaveBeenCalled();
    expect(dependencies.createDemoLandlord).not.toHaveBeenCalled();
    expect(dependencies.createDemoListing).not.toHaveBeenCalled();
  });

  it('does not partially populate a campus without enough unique verified addresses', async () => {
    const dependencies = createDependencies({
      findNearbyProperties: jest.fn().mockResolvedValue(candidates.slice(0, 2)),
    });

    await expect(importDemoProperties(dependencies, false)).resolves.toMatchObject([{
      created: 0,
      available: 2,
      unresolved: true,
    }]);
    expect(dependencies.createDemoLandlord).not.toHaveBeenCalled();
    expect(dependencies.createDemoListing).not.toHaveBeenCalled();
  });

  it('rejects candidate coordinates outside the valid proximity/coordinate bounds', async () => {
    const dependencies = createDependencies({
      findNearbyProperties: jest.fn().mockResolvedValue([
        ...candidates.slice(0, 2),
        { ...candidates[2], latitude: 95 },
      ]),
    });

    await expect(importDemoProperties(dependencies, false)).resolves.toMatchObject([{
      created: 0,
      available: 2,
      unresolved: true,
    }]);
    expect(dependencies.createDemoListing).not.toHaveBeenCalled();
  });
});
