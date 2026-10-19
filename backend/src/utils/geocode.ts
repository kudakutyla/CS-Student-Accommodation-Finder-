export type Coordinates = { latitude: number; longitude: number };
export type AddressResolution = { coordinates: Coordinates; usedFallback: boolean };

type AddressSearchContext = {
  locality: string;
  fallbackQuery?: string;
  fallbackQueries?: string[];
  label?: 'campus' | 'property';
};

export class LocationServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'LocationServiceError';
  }
}

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  category?: string;
  type?: string;
};
export type CampusPlaceSuggestion = {
  name: string;
  address: string;
  location: string;
};
export type CampusAddressSuggestion = {
  address: string;
};
type OsrmResponse = {
  code?: string;
  routes?: Array<{ distance?: number; geometry?: unknown }>;
};
export type RouteGeometry = {
  type: 'LineString';
  coordinates: Array<[number, number]>;
};
export type ListingRoutePreview = Coordinates & {
  campusCoordinates: Coordinates;
  distanceFromCampus: number;
  routeGeometry: RouteGeometry;
};
export type NearbyAccommodationLocation = Coordinates & { address: string };

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

async function searchAddress(
  query: string,
  viewbox?: string,
  resultLimit = 5
): Promise<NominatimResult[]> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', String(resultLimit));
  url.searchParams.set('countrycodes', 'za');
  if (viewbox) {
    url.searchParams.set('viewbox', viewbox);
    url.searchParams.set('bounded', '1');
  }

  let response: Response;
  try {
    response = await requestNominatim(url);
  } catch {
    throw new LocationServiceError('OpenStreetMap address lookup is temporarily unavailable. Try again later.', 503);
  }
  if (response.status === 429 || response.status >= 500) {
    console.warn('Nominatim address lookup received a transient HTTP response.', {
      status: response.status,
      retryAfter: response.headers.get('retry-after'),
    });
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

function hasValidCoordinates(result: NominatimResult): boolean {
  const latitude = typeof result.lat === 'string' ? Number(result.lat) : Number.NaN;
  const longitude = typeof result.lon === 'string' ? Number(result.lon) : Number.NaN;
  return typeof result.lat === 'string' && result.lat.trim() !== '' &&
    typeof result.lon === 'string' && result.lon.trim() !== '' &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function distanceBetweenCoordinatesKm(origin: Coordinates, destination: Coordinates): number {
  const radians = (degrees: number): number => degrees * Math.PI / 180;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export async function searchNearbyAccommodationLocations(
  campus: Coordinates & { name: string; locality: string },
  limit = 12
): Promise<NearbyAccommodationLocation[]> {
  const latitudeDelta = 0.08;
  const longitudeDelta = latitudeDelta / Math.max(Math.cos(campus.latitude * Math.PI / 180), 0.2);
  const viewbox = [
    campus.longitude - longitudeDelta,
    campus.latitude + latitudeDelta,
    campus.longitude + longitudeDelta,
    campus.latitude - latitudeDelta,
  ].join(',');
  const localityParts = campus.locality.split(',').map(normalizeTag).filter(Boolean);
  const accommodationTypes = new Set([
    'hostel',
    'dormitory',
    'student_accommodation',
    'student_residence',
    'apartments',
    'apartment',
    'guest_house',
    'boarding_house',
    'house',
    'residential',
  ]);
  const results = new Map<string, NearbyAccommodationLocation>();

  for (const query of [
    'hostel',
    'dormitory',
    'student accommodation',
    'apartment',
    'student residence',
    'guest house',
    'boarding house',
    'house',
    'residential building',
  ]) {
    for (const result of await searchAddress(query, viewbox, 20)) {
      const address = result.display_name?.trim();
      if (!address || !hasValidCoordinates(result)) continue;
      const normalizedAddress = normalizeTag(address);
      if (!localityParts.some((part) => normalizedAddress.includes(part))) continue;
      if (!accommodationTypes.has(normalizeTag(result.type ?? ''))) continue;
      const coordinates = {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
      };
      if (distanceBetweenCoordinatesKm(campus, coordinates) > 8) continue;
      if (!results.has(normalizedAddress)) results.set(normalizedAddress, { address, ...coordinates });
    }
    if (results.size >= limit) break;
  }

  return [...results.values()]
    .sort((left, right) =>
      distanceBetweenCoordinatesKm(campus, left) - distanceBetweenCoordinatesKm(campus, right)
    )
    .slice(0, limit);
}

export async function searchCampusAddressSuggestions(
  address: string,
  locality: string,
  campusName: string
): Promise<CampusAddressSuggestion[]> {
  const cleanAddress = address.trim();
  const cleanLocality = locality.trim();
  const cleanCampusName = campusName.trim();
  if (!cleanAddress || !cleanLocality) {
    throw new LocationServiceError('Enter an address and city or region to search.', 422);
  }

  const queries = [
    cleanAddress,
    `${cleanAddress}, ${cleanLocality}, South Africa`,
    ...(cleanCampusName ? [`${cleanCampusName}, ${cleanLocality}, South Africa`] : []),
  ];
  const localityParts = cleanLocality.split(',').map(normalizeTag).filter(Boolean);

  for (const query of [...new Set(queries)]) {
    const results = await searchAddress(query);
    const suggestions = new Map<string, CampusAddressSuggestion>();
    for (const result of results) {
      const displayName = result.display_name?.trim();
      if (!displayName || !hasValidCoordinates(result)) continue;
      const normalizedDisplayName = normalizeTag(displayName);
      if (!localityParts.some((part) => normalizedDisplayName.includes(part))) continue;
      if (!suggestions.has(normalizedDisplayName)) {
        suggestions.set(normalizedDisplayName, { address: displayName });
      }
    }
    if (suggestions.size > 0) return [...suggestions.values()].slice(0, 5);
  }

  return [];
}

export async function resolveAddressCoordinatesWithInfo(
  address: string,
  context?: AddressSearchContext
): Promise<AddressResolution> {
  const cleanAddress = address.trim();
  if (!cleanAddress) throw new LocationServiceError('A complete address is required.', 422);

  const queries: Array<{ query: string; usedFallback: boolean }> = [
    { query: cleanAddress, usedFallback: false },
  ];
  if (context?.locality.trim()) {
    queries.push({
      query: `${cleanAddress}, ${context.locality.trim()}, South Africa`,
      usedFallback: false,
    });
    if (context.fallbackQuery?.trim()) {
      queries.push({
        query: `${context.fallbackQuery.trim()}, ${context.locality.trim()}, South Africa`,
        usedFallback: true,
      });
    }
    for (const fallbackQuery of context.fallbackQueries ?? []) {
      if (fallbackQuery.trim()) {
        queries.push({
          query: `${fallbackQuery.trim()}, ${context.locality.trim()}, South Africa`,
          usedFallback: true,
        });
      }
    }
  }

  const uniqueQueries = [...new Map(
    queries.map(({ query, usedFallback }) => [query.trim(), { query: query.trim(), usedFallback }])
  ).values()];
  for (const { query, usedFallback } of uniqueQueries) {
    const results = await searchAddress(query);
    for (const result of results) {
      if (context?.locality.trim()) {
        const normalizedDisplayName = result.display_name ? normalizeTag(result.display_name) : '';
        const localityParts = context.locality.split(',').map(normalizeTag).filter(Boolean);
        const acceptedLocalities = context.label === 'campus' ? localityParts : localityParts.slice(0, 1);
        if (!normalizedDisplayName || !acceptedLocalities.some((locality) => normalizedDisplayName.includes(locality))) {
          continue;
        }
      }
      if (!hasValidCoordinates(result)) continue;
      const rawLatitude = result.lat;
      const rawLongitude = result.lon;
      const latitude = typeof rawLatitude === 'string' ? Number(rawLatitude) : Number.NaN;
      const longitude = typeof rawLongitude === 'string' ? Number(rawLongitude) : Number.NaN;
      return { coordinates: { latitude, longitude }, usedFallback };
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

export async function resolveAddressCoordinates(
  address: string,
  context?: AddressSearchContext
): Promise<Coordinates> {
  const result = await resolveAddressCoordinatesWithInfo(address, context);
  return result.coordinates;
}

export async function calculateRouteDistanceBetweenCoordinates(
  origin: Coordinates,
  destination: Coordinates
): Promise<number> {
  const route = await fetchRouteBetweenCoordinates(origin, destination, false);
  return route.distanceKm;
}

function isRouteGeometry(value: unknown): value is RouteGeometry {
  if (!value || typeof value !== 'object' || !('type' in value) || value.type !== 'LineString' ||
    !('coordinates' in value) || !Array.isArray(value.coordinates) || value.coordinates.length < 2) {
    return false;
  }
  return value.coordinates.every((coordinate): coordinate is [number, number] =>
    Array.isArray(coordinate) &&
    coordinate.length >= 2 &&
    typeof coordinate[0] === 'number' &&
    Number.isFinite(coordinate[0]) &&
    coordinate[0] >= -180 &&
    coordinate[0] <= 180 &&
    typeof coordinate[1] === 'number' &&
    Number.isFinite(coordinate[1]) &&
    coordinate[1] >= -90 &&
    coordinate[1] <= 90
  );
}

function fetchRouteBetweenCoordinates(
  origin: Coordinates,
  destination: Coordinates,
  includeGeometry: true
): Promise<{ distanceKm: number; geometry: RouteGeometry }>;
function fetchRouteBetweenCoordinates(
  origin: Coordinates,
  destination: Coordinates,
  includeGeometry: false
): Promise<{ distanceKm: number }>;
async function fetchRouteBetweenCoordinates(
  origin: Coordinates,
  destination: Coordinates,
  includeGeometry: boolean
): Promise<{ distanceKm: number; geometry?: RouteGeometry }> {
  const url = new URL(`${OSRM_URL}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`);
  url.searchParams.set('overview', includeGeometry ? 'full' : 'false');
  url.searchParams.set('alternatives', 'false');
  if (includeGeometry) url.searchParams.set('geometries', 'geojson');

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

  const route = result.code === 'Ok' ? result.routes?.[0] : undefined;
  const distanceMeters = route?.distance;
  if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new LocationServiceError('OpenStreetMap did not return a valid route distance. Check both addresses and try again.', 422);
  }

  const distanceKm = distanceMeters / 1000;
  if (!includeGeometry) return { distanceKm };
  if (!isRouteGeometry(route?.geometry)) {
    throw new LocationServiceError('OpenStreetMap returned an invalid route geometry. Try again later.', 503);
  }
  return { distanceKm, geometry: route.geometry };
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

export async function resolveListingRoutePreview(
  propertyAddress: string,
  campusAddress: string,
  campusContext?: { name: string; locality: string }
): Promise<ListingRoutePreview> {
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
  const route = await fetchRouteBetweenCoordinates(coordinates, campusCoordinates, true);
  return {
    ...coordinates,
    campusCoordinates,
    distanceFromCampus: route.distanceKm,
    routeGeometry: route.geometry,
  };
}
