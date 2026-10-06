import {
  calculateGoogleRouteDistanceKm,
  resolveAddressCoordinates,
  resolveListingLocation,
} from '../src/utils/geocode';

const originalApiKey = process.env.GOOGLE_MAPS_API_KEY;
const originalFetch = global.fetch;

describe('Google Maps address and route services', () => {
  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-google-key';
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('resolves the property address and converts route meters to kilometers', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: [{ geometry: { location: { lat: -25.75, lng: 28.2 } } }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [{ distanceMeters: 12500 }] }),
      } as Response);

    await expect(resolveListingLocation('10 Main Road', 'Campus Avenue, Pretoria')).resolves.toEqual({
      latitude: -25.75,
      longitude: 28.2,
      distanceFromCampus: 12.5,
    });

    const routeRequest = fetchMock.mock.calls[1];
    expect(routeRequest[0]).toBe('https://routes.googleapis.com/directions/v2:computeRoutes');
    expect(routeRequest[1]?.headers).toMatchObject({
      'X-Goog-Api-Key': 'test-google-key',
      'X-Goog-FieldMask': 'routes.distanceMeters',
    });
  });

  it('fails rather than substituting coordinates when the API key is missing', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;

    await expect(resolveAddressCoordinates('10 Main Road')).rejects.toThrow(/not configured/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a route response without a distance', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ routes: [] }),
    } as Response);

    await expect(calculateGoogleRouteDistanceKm('10 Main Road', 'Campus Avenue')).rejects.toThrow(/valid route distance/i);
  });
});