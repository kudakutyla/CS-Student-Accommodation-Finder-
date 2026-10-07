export type Coordinates = { latitude: number; longitude: number };

export class GoogleMapsError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'GoogleMapsError';
  }
}

type GeocodingResponse = {
  status?: string;
  results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
};

type RoutesResponse = { routes?: Array<{ distanceMeters?: number }> };

function getGoogleMapsKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new GoogleMapsError('Google Maps is not configured. Ask the administrator to add the backend key before creating or updating campus or listing addresses.', 503);
  return key;
}

export async function resolveAddressCoordinates(address: string): Promise<Coordinates> {
  const cleanAddress = address.trim();
  if (!cleanAddress) throw new GoogleMapsError('A complete address is required.', 422);

  const key = getGoogleMapsKey();
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', cleanAddress);
  url.searchParams.set('key', key);

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new GoogleMapsError('Google Maps address lookup is temporarily unavailable. Try again later.', 503);
  }
  if (!response.ok) throw new GoogleMapsError('Google Maps could not resolve the address. Check it and try again.', 422);

  let result: GeocodingResponse;
  try {
    result = (await response.json()) as GeocodingResponse;
  } catch {
    throw new GoogleMapsError('Google Maps returned an unreadable address result. Try again later.', 503);
  }
  const location = result.status === 'OK' ? result.results?.[0]?.geometry?.location : undefined;
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new GoogleMapsError('The address could not be resolved. Enter a complete street address and try again.', 422);
  }

  return { latitude: location.lat, longitude: location.lng };
}

export async function calculateGoogleRouteDistanceKm(origin: string, destination: string): Promise<number> {
  const cleanOrigin = origin.trim();
  const cleanDestination = destination.trim();
  if (!cleanOrigin || !cleanDestination) throw new GoogleMapsError('Both property and campus addresses are required.', 422);

  let response: Response;
  try {
    response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getGoogleMapsKey(),
      'X-Goog-FieldMask': 'routes.distanceMeters',
    },
    body: JSON.stringify({
      origin: { address: cleanOrigin },
      destination: { address: cleanDestination },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
    }),
    });
  } catch {
    throw new GoogleMapsError('Google Maps route calculation is temporarily unavailable. Try again later.', 503);
  }

  if (!response.ok) throw new GoogleMapsError('Google Maps could not calculate the route. Check service configuration and try again.', 503);
  let result: RoutesResponse;
  try {
    result = (await response.json()) as RoutesResponse;
  } catch {
    throw new GoogleMapsError('Google Maps returned an unreadable route result. Try again later.', 503);
  }
  const distanceMeters = result.routes?.[0]?.distanceMeters;
  if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new GoogleMapsError('Google Maps did not return a valid route distance. Check both addresses and try again.', 422);
  }

  return distanceMeters / 1000;
}

export async function resolveListingLocation(
  propertyAddress: string,
  campusAddress: string
): Promise<Coordinates & { distanceFromCampus: number }> {
  const [coordinates, distanceFromCampus] = await Promise.all([
    resolveAddressCoordinates(propertyAddress),
    calculateGoogleRouteDistanceKm(propertyAddress, campusAddress),
  ]);
  return { ...coordinates, distanceFromCampus };
}
