export type DemoPropertyCampus = {
  id: string;
  name: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type DemoPropertyCandidate = {
  address: string;
  latitude: number;
  longitude: number;
  distanceFromCampus: number;
};

export type DemoPropertyImportDependencies = {
  getActiveCampuses: () => Promise<DemoPropertyCampus[]>;
  findDemoLandlordId: (email: string) => Promise<string | null>;
  getExistingListings: (
    ownerId: string,
    campusId: string
  ) => Promise<Array<{ title: string; address: string }>>;
  findNearbyProperties: (
    campus: DemoPropertyCampus,
    limit: number
  ) => Promise<DemoPropertyCandidate[]>;
  createDemoLandlord: (campus: DemoPropertyCampus, email: string) => Promise<string>;
  createDemoListing: (data: {
    ownerId: string;
    campusId: string;
    title: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    distanceFromCampus: number;
    propertyNumber: number;
    availabilityStatus: 'AVAILABLE';
    approvalStatus: 'PENDING';
  }) => Promise<void>;
};

export type DemoPropertyCampusSummary = {
  campus: string;
  existing: number;
  available: number;
  created: number;
  wouldCreate: number;
  unresolved: boolean;
};

const LISTINGS_PER_CAMPUS = 3;
const MAX_ROUTE_DISTANCE_KM = 10;

export function demoLandlordEmail(campusId: string): string {
  return `demo-landlord-${campusId}@example.test`;
}

export function demoPropertyTitle(campusName: string, propertyNumber: number): string {
  return `[DEMO DATA] ${campusName} - Sample Property ${propertyNumber}`;
}

function isValidCandidate(candidate: DemoPropertyCandidate): boolean {
  return Boolean(candidate.address.trim()) &&
    Number.isFinite(candidate.latitude) && candidate.latitude >= -90 && candidate.latitude <= 90 &&
    Number.isFinite(candidate.longitude) && candidate.longitude >= -180 && candidate.longitude <= 180 &&
    Number.isFinite(candidate.distanceFromCampus) &&
    candidate.distanceFromCampus >= 0 &&
    candidate.distanceFromCampus <= MAX_ROUTE_DISTANCE_KM;
}

export async function importDemoProperties(
  dependencies: DemoPropertyImportDependencies,
  dryRun: boolean
): Promise<DemoPropertyCampusSummary[]> {
  const campuses = await dependencies.getActiveCampuses();
  const summaries: DemoPropertyCampusSummary[] = [];

  for (const campus of campuses) {
    const email = demoLandlordEmail(campus.id);
    const existingOwnerId = await dependencies.findDemoLandlordId(email);
    const existingListings = existingOwnerId
      ? await dependencies.getExistingListings(existingOwnerId, campus.id)
      : [];
    const existingTitles = new Set(existingListings.map((listing) => listing.title));
    const propertyNumbers = Array.from(
      { length: LISTINGS_PER_CAMPUS },
      (_, index) => index + 1
    ).filter((number) => !existingTitles.has(demoPropertyTitle(campus.name, number)));
    const summary: DemoPropertyCampusSummary = {
      campus: campus.name,
      existing: LISTINGS_PER_CAMPUS - propertyNumbers.length,
      available: 0,
      created: 0,
      wouldCreate: 0,
      unresolved: false,
    };
    summaries.push(summary);
    if (propertyNumbers.length === 0) continue;

    const usedAddresses = new Set(existingListings.map((listing) => listing.address.trim().toLocaleLowerCase()));
    const candidates = (await dependencies.findNearbyProperties(campus, propertyNumbers.length))
      .filter(isValidCandidate)
      .filter((candidate, index, allCandidates) =>
        !usedAddresses.has(candidate.address.trim().toLocaleLowerCase()) &&
        allCandidates.findIndex((other) =>
          other.address.trim().toLocaleLowerCase() === candidate.address.trim().toLocaleLowerCase()
        ) === index
      )
      .slice(0, propertyNumbers.length);

    summary.available = candidates.length;
    if (candidates.length < propertyNumbers.length) {
      summary.unresolved = true;
      continue;
    }
    if (dryRun) {
      summary.wouldCreate = candidates.length;
      continue;
    }

    const ownerId = existingOwnerId ?? await dependencies.createDemoLandlord(campus, email);
    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      const propertyNumber = propertyNumbers[index];
      await dependencies.createDemoListing({
        ownerId,
        campusId: campus.id,
        title: demoPropertyTitle(campus.name, propertyNumber),
        description:
          'DEMONSTRATION ONLY: This fictional listing is test data, not a real accommodation offer. ' +
          'Do not contact anyone or rely on its details.',
        address: candidate.address,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        distanceFromCampus: candidate.distanceFromCampus,
        propertyNumber,
        availabilityStatus: 'AVAILABLE',
        approvalStatus: 'PENDING',
      });
      summary.created += 1;
    }
  }

  return summaries;
}
