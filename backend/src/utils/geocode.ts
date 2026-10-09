export type Coordinates = { latitude: number; longitude: number };

type AddressSearchContext = {
  locality: string;
  fallbackQuery?: string;
  label?: 'campus' | 'property';
};

export class LocationServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'LocationServiceError';
  }
}

type NominatimResult = { lat?: string; lon?: string; display_name?: string };
export type CampusPlaceSuggestion = {
  name: string;
  address: string;
  location: string;
};
type OsrmResponse = {
  code?: string;
  routes?: Array<{ distance?: number }>;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const NOMINATIM_USER_AGENT = 'StudentAccommodationFinder/1.0 (https://github.com/kudakutyla/CS-Student-Accommodation-Finder)';
const MAX_CAMPUS_SUGGESTIONS = 100;

let nominatimQueue: Promise<void> = Promise.resolve();
let nextNominatimRequestAt = 0;

async function requestNominatim(url: URL, signal?: AbortSignal): Promise<Response> {
  const previousRequest = nominatimQueue;
  let releaseQueue!: () => void;
  nominatimQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  await previousRequest;
  try {
    const waitMs = Math.max(0, nextNominatimRequestAt - Date.now());
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    nextNominatimRequestAt = Date.now() + 1000;
    return await fetch(url, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      signal,
    });
  } finally {
    releaseQueue();
  }
}

function escapeOverpassRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeOverpassString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeTag(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseCampusSuggestions(payload: unknown, institutionNames: string[]): CampusPlaceSuggestion[] {
  if (!payload || typeof payload !== 'object' || !('elements' in payload) || !Array.isArray(payload.elements)) {
    throw new LocationServiceError('OpenStreetMap returned invalid campus results.', 502);
  }
  const expectedInstitutions = institutionNames.map(normalizeTag);
  const suggestions = new Map<string, CampusPlaceSuggestion>();

  for (const item of payload.elements) {
    if (!item || typeof item !== 'object' || !('tags' in item) || !item.tags || typeof item.tags !== 'object') continue;
    const tags = item.tags as Record<string, unknown>;
    const getTag = (key: string): string => typeof tags[key] === 'string' ? (tags[key] as string).trim() : '';
    const amenity = getTag('amenity');
    const name = getTag('name');
    if ((amenity !== 'university' && amenity !== 'college') || !name) continue;

    const institutionTags = [getTag('operator'), getTag('brand'), name];
    if (!institutionTags.some((value) =>
      expectedInstitutions.some((institution) => normalizeTag(value).includes(institution))
    )) continue;

    const city = getTag('addr:city') || getTag('addr:town') || getTag('addr:village') ||
      getTag('addr:municipality') || getTag('addr:suburb');
    const region = getTag('addr:state') || getTag('addr:province');
    const location = [city, region].filter(Boolean).join(', ') || 'South Africa';
    const street = [getTag('addr:housenumber'), getTag('addr:street')].filter(Boolean).join(' ');
    const address = [
      street || name,
      getTag('addr:suburb'),
      city,
      region,
      getTag('addr:postcode'),
      'South Africa',
    ].filter(Boolean).filter((part, index, parts) => parts.indexOf(part) === index).join(', ');
    const key = `${normalizeTag(name)}|${normalizeTag(address)}`;
    if (!suggestions.has(key)) suggestions.set(key, { name, address, location });
  }

  return [...suggestions.values()]
    .sort((left, right) => left.name.localeCompare(right.name, 'en-ZA'))
    .slice(0, MAX_CAMPUS_SUGGESTIONS);
}

export async function searchInstitutionCampuses(
  institutionName: string,
  institutionShortName?: string | null
): Promise<CampusPlaceSuggestion[]> {
  const institutionNames = [...new Set([institutionName, institutionShortName || ''].map((name) => name.trim()).filter(Boolean))];
  const institutionPatterns = institutionNames.map((name) => escapeOverpassString(escapeOverpassRegex(name)));
  const query = [
    '[out:json][timeout:20];',
    'area["ISO3166-1"="ZA"]["admin_level"="2"]->.south_africa;',
    '(',
    ...institutionPatterns.flatMap((pattern) => [
      `nwr["amenity"~"^(university|college)$"]["operator"~"${pattern}",i](area.south_africa);`,
      `nwr["amenity"~"^(university|college)$"]["brand"~"${pattern}",i](area.south_africa);`,
      `nwr["amenity"~"^(university|college)$"]["name"~"${pattern}",i](area.south_africa);`,
    ]),
    ');',
    `out tags center ${MAX_CAMPUS_SUGGESTIONS};`,
  ].join('\n');

  let response: Response;
  try {
    response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': NOMINATIM_USER_AGENT,
        Accept: 'application/json',
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    throw new LocationServiceError('OpenStreetMap campus search is temporarily unavailable. Try again later.', 503);
  }
  if (response.status === 429 || response.status === 504 || response.status >= 500) {
    throw new LocationServiceError('OpenStreetMap campus search is busy or temporarily unavailable. Try again later.', 503);
  }
  if (!response.ok) {
    throw new LocationServiceError('OpenStreetMap could not search campuses. Try again later.', 502);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new LocationServiceError('OpenStreetMap returned unreadable campus results.', 502);
  }

  if (payload && typeof payload === 'object' && 'remark' in payload && typeof payload.remark === 'string') {
    throw new LocationServiceError('OpenStreetMap could not complete the campus search. Try again later.', 503);
  }
  return parseCampusSuggestions(payload, institutionNames);
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'za');

  let response: Response;
  try {
    response = await requestNominatim(url);
  } catch {
    throw new LocationServiceError('OpenStreetMap address lookup is temporarily unavailable. Try again later.', 503);
  }
  if (response.status === 429 || response.status >= 500) {
    throw new LocationServiceError('OpenStreetMap address lookup is busy or temporarily unavailable. Try again later.', 503);
  }
  if (!response.ok) {
    throw new LocationServiceError('OpenStreetMap could not resolve the address. Check the address and try again.', 422);
  }

  try {
    const body: unknown = await response.json();
    if (!Array.isArray(body)) throw new Error('Expected an array of geocoding results.');
    return body as NominatimResult[];
  } catch {
    throw new LocationServiceError('OpenStreetMap returned an unreadable address result. Try again later.', 503);
  }
}

export async function resolveAddressCoordinates(
  address: string,
  context?: AddressSearchContext
): Promise<Coordinates> {
  const cleanAddress = address.trim();
  if (!cleanAddress) throw new LocationServiceError('A complete address is required.', 422);

  const queries = [cleanAddress];
  if (context?.locality.trim()) {
    queries.push(`${cleanAddress}, ${context.locality.trim()}, South Africa`);
    if (context.fallbackQuery?.trim()) {
      queries.push(`${context.fallbackQuery.trim()}, ${context.locality.trim()}, South Africa`);
    }
  }

  const uniqueQueries = [...new Set(queries.map((query) => query.trim()))];
  for (const query of uniqueQueries) {
    const results = await searchAddress(query);
    for (const result of results) {
      if (context?.locality.trim()) {
        const normalizedDisplayName = result.display_name?.toLocaleLowerCase();
        const primaryLocality = context.locality.split(',')[0].trim().toLocaleLowerCase();
        if (!normalizedDisplayName || !primaryLocality || !normalizedDisplayName.includes(primaryLocality)) {
          continue;
        }
      }
      const rawLatitude = result.lat;
      const rawLongitude = result.lon;
      const latitude = typeof rawLatitude === 'string' ? Number(rawLatitude) : Number.NaN;
      const longitude = typeof rawLongitude === 'string' ? Number(rawLongitude) : Number.NaN;
      if (
        typeof rawLatitude === 'string' &&
        rawLatitude.trim() &&
        typeof rawLongitude === 'string' &&
        rawLongitude.trim() &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        return { latitude, longitude };
      }
    }
  }

  throw new LocationServiceError(
    context?.label === 'campus'
      ? 'OpenStreetMap could not find this campus. Check the campus name, street address, suburb, and city, then try again.'
      : context?.label === 'property'
        ? 'OpenStreetMap could not find this property address near the selected campus. Check the street address, suburb, and city, then try again.'
        : 'The address could not be resolved. Enter a complete South African street address and try again.',
    422
  );
}

async function calculateRouteDistanceBetweenCoordinates(
  origin: Coordinates,
  destination: Coordinates
): Promise<number> {
  const url = new URL(`${OSRM_URL}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`);
  url.searchParams.set('overview', 'false');
  url.searchParams.set('alternatives', 'false');

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new LocationServiceError('OpenStreetMap route calculation is temporarily unavailable. Try again later.', 503);
  }
  if (!response.ok) {
    throw new LocationServiceError('OpenStreetMap could not calculate the route. Check both addresses and try again.', 503);
  }

  let result: OsrmResponse;
  try {
    result = (await response.json()) as OsrmResponse;
  } catch {
    throw new LocationServiceError('OpenStreetMap returned an unreadable route result. Try again later.', 503);
  }

  const distanceMeters = result.code === 'Ok' ? result.routes?.[0]?.distance : undefined;
  if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new LocationServiceError('OpenStreetMap did not return a valid route distance. Check both addresses and try again.', 422);
  }

  return distanceMeters / 1000;
}

export async function calculateRouteDistanceKm(origin: string, destination: string): Promise<number> {
  const cleanOrigin = origin.trim();
  const cleanDestination = destination.trim();
  if (!cleanOrigin || !cleanDestination) {
    throw new LocationServiceError('Both property and campus addresses are required.', 422);
  }

  const [originCoordinates, destinationCoordinates] = await Promise.all([
    resolveAddressCoordinates(cleanOrigin),
    resolveAddressCoordinates(cleanDestination),
  ]);
  return calculateRouteDistanceBetweenCoordinates(originCoordinates, destinationCoordinates);
}

export async function resolveListingLocation(
  propertyAddress: string,
  campusAddress: string,
  campusContext?: { name: string; locality: string }
): Promise<Coordinates & { distanceFromCampus: number }> {
  const cleanPropertyAddress = propertyAddress.trim();
  const cleanCampusAddress = campusAddress.trim();
  if (!cleanPropertyAddress || !cleanCampusAddress) {
    throw new LocationServiceError('Both property and campus addresses are required.', 422);
  }

  const coordinates = await resolveAddressCoordinates(cleanPropertyAddress, campusContext
    ? { locality: campusContext.locality, label: 'property' }
    : undefined);
  const campusCoordinates = await resolveAddressCoordinates(cleanCampusAddress, campusContext
    ? { locality: campusContext.locality, fallbackQuery: campusContext.name, label: 'campus' }
    : undefined);
  const distanceFromCampus = await calculateRouteDistanceBetweenCoordinates(coordinates, campusCoordinates);
  return { ...coordinates, distanceFromCampus };
}
