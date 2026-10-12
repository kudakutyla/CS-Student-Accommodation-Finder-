import {
  CampusPlaceSuggestion,
  Coordinates,
  LocationServiceError,
} from './geocode';

export type CampusCatalogInstitution = {
  id: string;
  name: string;
  shortName: string | null;
};

export type CampusCatalogImporterDependencies = {
  getActiveInstitutions: () => Promise<CampusCatalogInstitution[]>;
  getExistingCampusNames: () => Promise<Set<string>>;
  findCampusSuggestions: (
    institutionName: string,
    shortName: string | null
  ) => Promise<CampusPlaceSuggestion[]>;
  resolveCoordinates: (
    address: string,
    context: { locality: string; fallbackQuery: string; label: 'campus' }
  ) => Promise<Coordinates>;
  createCampus: (data: {
    name: string;
    institutionId: string;
    location: string;
    address: string;
    latitude: number;
    longitude: number;
    isActive: true;
  }) => Promise<void>;
};

export type CampusCatalogImportSummary = {
  institution: string;
  created: string[];
  wouldCreate: string[];
  alreadyExists: string[];
  unresolved: string[];
  unmapped: boolean;
  notProcessed: number;
};

const MAX_CAMPUSES_PER_INSTITUTION = 5;

function isUsefulLocality(location: string): boolean {
  const normalized = location.trim().toLocaleLowerCase();
  return normalized.length >= 2 && normalized !== 'south africa';
}

function isUniqueConstraintError(error: unknown): boolean {
  return error !== null && typeof error === 'object' &&
    'code' in error && error.code === 'P2002';
}

export async function importCampusCatalog(
  dependencies: CampusCatalogImporterDependencies,
  dryRun: boolean
): Promise<CampusCatalogImportSummary[]> {
  const institutions = await dependencies.getActiveInstitutions();
  const existingNames = await dependencies.getExistingCampusNames();
  const summaries: CampusCatalogImportSummary[] = [];

  for (const institution of institutions) {
    const summary: CampusCatalogImportSummary = {
      institution: institution.name,
      created: [],
      wouldCreate: [],
      alreadyExists: [],
      unresolved: [],
      unmapped: false,
      notProcessed: 0,
    };
    summaries.push(summary);

    const suggestions = await dependencies.findCampusSuggestions(institution.name, institution.shortName);
    if (suggestions.length === 0) {
      summary.unmapped = true;
      continue;
    }

    summary.notProcessed = Math.max(0, suggestions.length - MAX_CAMPUSES_PER_INSTITUTION);
    for (const suggestion of suggestions.slice(0, MAX_CAMPUSES_PER_INSTITUTION)) {
      if (existingNames.has(suggestion.name.trim().toLocaleLowerCase())) {
        summary.alreadyExists.push(suggestion.name);
        continue;
      }

      if (!isUsefulLocality(suggestion.location)) {
        summary.unresolved.push(suggestion.name);
        continue;
      }

      let coordinates: Coordinates;
      try {
        coordinates = await dependencies.resolveCoordinates(suggestion.address, {
          locality: suggestion.location,
          fallbackQuery: suggestion.name,
          label: 'campus',
        });
      } catch (error) {
        if (error instanceof LocationServiceError && error.statusCode === 422) {
          summary.unresolved.push(suggestion.name);
          continue;
        }
        throw error;
      }

      if (dryRun) {
        summary.wouldCreate.push(suggestion.name);
        continue;
      }

      try {
        await dependencies.createCampus({
          name: suggestion.name,
          institutionId: institution.id,
          location: suggestion.location,
          address: suggestion.address,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          isActive: true,
        });
        existingNames.add(suggestion.name.trim().toLocaleLowerCase());
        summary.created.push(suggestion.name);
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          existingNames.add(suggestion.name.trim().toLocaleLowerCase());
          summary.alreadyExists.push(suggestion.name);
          continue;
        }
        throw error;
      }
    }
  }

  return summaries;
}
