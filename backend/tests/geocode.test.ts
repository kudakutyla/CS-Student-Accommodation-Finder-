import {
  calculateRouteDistanceKm,
  resolveAddressCoordinates,
  resolveAddressCoordinatesWithInfo,
  resolveListingLocation,
  resolveListingRoutePreview,
  searchCampusAddressSuggestions,
  searchInstitutionCampuses,
  searchNearbyAccommodationLocations,
} from '../src/utils/geocode';

const originalFetch = global.fetch;
const originalApiKey = process.env.GOOGLE_MAPS_API_KEY;

describe('OpenStreetMap address and route services', () => {
  beforeEach(() => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('geocodes both addresses and converts OSRM route meters to kilometers', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '-25.75', lon: '28.2' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '-25.8', lon: '28.3' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 'Ok', routes: [{ distance: 12500 }] }),
      } as Response);

    await expect(resolveListingLocation('10 Main Road', 'Campus Avenue, Pretoria')).resolves.toEqual({
      latitude: -25.75,
      longitude: 28.2,
      distanceFromCampus: 12.5,
    });

    const originRequest = new URL(String(fetchMock.mock.calls[0][0]));
    expect(originRequest.origin + originRequest.pathname).toBe('https://nominatim.openstreetmap.org/search');
    expect(originRequest.searchParams.get('q')).toBe('10 Main Road');
    expect(originRequest.searchParams.get('format')).toBe('jsonv2');
    expect(originRequest.searchParams.get('limit')).toBe('5');
    expect(originRequest.searchParams.get('countrycodes')).toBe('za');
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      'User-Agent': expect.stringContaining('StudentAccommodationFinder'),
    });

    const routeRequest = new URL(String(fetchMock.mock.calls[2][0]));
    expect(routeRequest.toString()).toContain('/route/v1/driving/28.2,-25.75;28.3,-25.8');
    expect(routeRequest.searchParams.get('overview')).toBe('false');
  });

  it('returns server-calculated route geometry and distance for a map preview', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '-25.75', lon: '28.2' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '-25.8', lon: '28.3' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 'Ok',
          routes: [{
            distance: 12500,
            geometry: {
              type: 'LineString',
              coordinates: [[28.2, -25.75], [28.3, -25.8]],
            },
          }],
        }),
      } as Response);

    await expect(resolveListingRoutePreview('10 Main Road', 'Campus Avenue, Pretoria')).resolves.toEqual({
      latitude: -25.75,
      longitude: 28.2,
      campusCoordinates: { latitude: -25.8, longitude: 28.3 },
      distanceFromCampus: 12.5,
      routeGeometry: {
        type: 'LineString',
        coordinates: [[28.2, -25.75], [28.3, -25.8]],
      },
    });

    const routeRequest = new URL(String(fetchMock.mock.calls[2][0]));
    expect(routeRequest.searchParams.get('overview')).toBe('full');
    expect(routeRequest.searchParams.get('geometries')).toBe('geojson');
  });

  it('rejects invalid OSRM geometry from a route preview', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '-25.75', lon: '28.2' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '-25.8', lon: '28.3' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 'Ok',
          routes: [{ distance: 12500, geometry: { type: 'Point', coordinates: [28.2, -25.75] } }],
        }),
      } as Response);

    await expect(resolveListingRoutePreview('10 Main Road', 'Campus Avenue, Pretoria'))
      .rejects.toThrow(/invalid route geometry/i);
  });

  it('rejects an address that Nominatim cannot resolve', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    await expect(resolveAddressCoordinates('unknown address')).rejects.toThrow(/could not be resolved/i);
  });

  it('finds a campus address using locality context and returns only formatted addresses', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-26.2',
          lon: '28.0',
          display_name: 'University Road, Johannesburg, Mpumalanga, South Africa',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-25.7479',
          lon: '28.2293',
          display_name: 'University Road, Hatfield, Pretoria, Gauteng, South Africa',
        }],
      } as Response);

    await expect(searchCampusAddressSuggestions(
      'University Road',
      'Pretoria, Gauteng',
      'Example University'
    )).resolves.toEqual([{
      address: 'University Road, Hatfield, Pretoria, Gauteng, South Africa',
    }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('q'))
      .toBe('University Road, Pretoria, Gauteng, South Africa');
  });

  it('uses the campus name as address lookup fallback and rejects other localities', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-26.2',
          lon: '28.0',
          display_name: 'Campus, Johannesburg, Mpumalanga, South Africa',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-25.7479',
          lon: '28.2293',
          display_name: 'Example University, Pretoria, Gauteng, South Africa',
        }],
      } as Response);

    await expect(searchCampusAddressSuggestions(
      'Campus',
      'Pretoria, Gauteng',
      'Example University'
    )).resolves.toEqual([{
      address: 'Example University, Pretoria, Gauteng, South Africa',
    }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(new URL(String(fetchMock.mock.calls[2][0])).searchParams.get('q'))
      .toBe('Example University, Pretoria, Gauteng, South Africa');
  });

  it('finds distinct accommodation addresses in the campus locality and bounded map area', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            lat: '-25.751',
            lon: '28.201',
            display_name: 'Student Hostel, Pretoria, Gauteng, South Africa',
            type: 'hostel',
          },
          {
            lat: '-25.752',
            lon: '28.202',
            display_name: 'Another Hostel, Durban, KwaZulu-Natal, South Africa',
            type: 'hostel',
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-25.751',
          lon: '28.201',
          display_name: 'Student Hostel, Pretoria, Gauteng, South Africa',
          type: 'hostel',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-25.752',
          lon: '28.201',
          display_name: 'Campus Apartments, Hatfield, Pretoria, Gauteng, South Africa',
          type: 'apartments',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

    await expect(searchNearbyAccommodationLocations({
      name: 'Example Campus',
      locality: 'Pretoria, Gauteng',
      latitude: -25.75,
      longitude: 28.2,
    }, 2)).resolves.toEqual([
      {
        address: 'Student Hostel, Pretoria, Gauteng, South Africa',
        latitude: -25.751,
        longitude: 28.201,
      },
      {
        address: 'Campus Apartments, Hatfield, Pretoria, Gauteng, South Africa',
        latitude: -25.752,
        longitude: 28.201,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [request] of fetchMock.mock.calls) {
      const url = new URL(String(request));
      expect(url.searchParams.get('bounded')).toBe('1');
      expect(url.searchParams.get('viewbox')).toBeTruthy();
    }
  });

  it('does not try contextual address suggestions after a provider error', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

    await expect(searchCampusAddressSuggestions(
      'University Road',
      'Pretoria, Gauteng',
      'Example University'
    )).rejects.toThrow(/busy or temporarily unavailable/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([429, 503])('logs Nominatim HTTP %s without logging the searched address', async (status) => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const warningSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce(new Response(null, {
      status,
      headers: { 'retry-after': '3' },
    }));

    await expect(searchCampusAddressSuggestions(
      'Confidential University Road',
      'Pretoria, Gauteng',
      'Example University'
    )).rejects.toMatchObject({
      statusCode: 503,
      message: 'OpenStreetMap address lookup is busy or temporarily unavailable. Try again later.',
    });

    expect(warningSpy).toHaveBeenCalledWith(
      'Nominatim address lookup received a transient HTTP response.',
      { status, retryAfter: '3' }
    );
    expect(JSON.stringify(warningSpy.mock.calls)).not.toContain('Confidential University Road');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('searches Overpass for South African places associated with the selected institution', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: [
        {
          type: 'node',
          lat: -28.73,
          lon: 24.76,
          tags: {
            name: 'Sol Plaatje University (North Campus)',
            amenity: 'university',
            operator: 'Sol Plaatje University',
            'addr:city': 'Kimberley',
            'addr:state': 'Northern Cape',
            'addr:street': 'Sol Plaatje Drive',
          },
        },
        {
          type: 'way',
          center: { lat: -28.75, lon: 24.77 },
          tags: {
            name: 'Sol Plaatje University (South Campus)',
            amenity: 'college',
            brand: 'Sol Plaatje University',
            'addr:city': 'Kimberley',
            'addr:state': 'Northern Cape',
          },
        },
        {
          type: 'relation',
          center: { lat: -28.75, lon: 24.77 },
          tags: {
            name: 'Sol Plaatje University (South Campus)',
            amenity: 'college',
            operator: 'Sol Plaatje University',
            'addr:city': 'Kimberley',
            'addr:state': 'Northern Cape',
          },
        },
        {
          type: 'node',
          tags: {
            name: 'SPU Main Campus',
            amenity: 'university',
            operator: 'SPU',
            'addr:city': 'Kimberley',
            'addr:state': 'Northern Cape',
          },
        },
        {
          type: 'node',
          tags: {
            name: 'Unrelated College',
            amenity: 'college',
            operator: 'Another Institution',
          },
        },
        {
          type: 'node',
          tags: {
            name: 'Sol Plaatje University Library',
            amenity: 'library',
            operator: 'Sol Plaatje University',
          },
        },
      ] }),
    } as Response);

    await expect(searchInstitutionCampuses('Sol Plaatje University', 'SPU')).resolves.toEqual([
      {
        name: 'Sol Plaatje University (North Campus)',
        address: 'Sol Plaatje Drive, Kimberley, Northern Cape, South Africa',
        location: 'Kimberley, Northern Cape',
      },
      {
        name: 'Sol Plaatje University (South Campus)',
        address: 'Sol Plaatje University (South Campus), Kimberley, Northern Cape, South Africa',
        location: 'Kimberley, Northern Cape',
      },
      {
        name: 'SPU Main Campus',
        address: 'SPU Main Campus, Kimberley, Northern Cape, South Africa',
        location: 'Kimberley, Northern Cape',
      },
    ]);

    expect(fetchMock.mock.calls[0][0]).toBe('https://overpass-api.de/api/interpreter');
    const options = fetchMock.mock.calls[0][1];
    expect(options?.method).toBe('POST');
    expect(options?.headers).toMatchObject({
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': expect.stringContaining('StudentAccommodationFinder'),
    });
    const body = new URLSearchParams(String(options?.body)).get('data') || '';
    expect(body).toContain('area["ISO3166-1"="ZA"]');
    expect(body).toContain('"operator"~"Sol Plaatje University",i');
    expect(body).toContain('"brand"~"Sol Plaatje University",i');
    expect(body).toContain('"name"~"Sol Plaatje University",i');
    expect(body).toContain('"operator"~"SPU",i');
    expect(body).toContain('out tags center 100;');
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('escapes regular-expression characters in institution names', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: [] }),
    } as Response);

    await expect(searchInstitutionCampuses('A+B (South)')).resolves.toEqual([]);
    const body = new URLSearchParams(String((global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0][1]?.body)).get('data') || '';
    expect(body).toContain('A\\\\+B \\\\(South\\\\)');
  });

  it('returns an empty list when no OSM campuses match the institution', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: [] }),
    } as Response);

    await expect(searchInstitutionCampuses('Unknown Institution')).resolves.toEqual([]);
  });

  it('rejects malformed Overpass campus responses', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: 'invalid' }),
    } as Response);

    await expect(searchInstitutionCampuses('Sol Plaatje University')).rejects.toThrow(/invalid campus results/i);
  });

  it('returns a service error when Overpass is unavailable', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    await expect(searchInstitutionCampuses('Sol Plaatje University')).rejects.toThrow(/busy or temporarily unavailable/i);
  });

  it('retries an unmatched campus address with city and campus name context', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-28.7497',
          lon: '24.7649',
          display_name: 'Sol Plaatje University, Kimberley, Northern Cape, South Africa',
        }],
      } as Response);

    await expect(resolveAddressCoordinates('University campus', {
      locality: 'Kimberley, Northern Cape',
      fallbackQuery: 'Sol Plaatje University',
    })).resolves.toEqual({ latitude: -28.7497, longitude: 24.7649 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('q')).toBe('University campus');
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('q')).toBe('University campus, Kimberley, Northern Cape, South Africa');
    expect(new URL(String(fetchMock.mock.calls[2][0])).searchParams.get('q')).toBe('Sol Plaatje University, Kimberley, Northern Cape, South Africa');
  });

  it('uses the selected institution as the final fallback for an unmapped campus address', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-32.7848724',
          lon: '26.8501634',
          display_name: 'University of Fort Hare, Thompson Street, Alice, Amathole District Municipality, Eastern Cape, South Africa',
        }],
      } as Response);

    await expect(resolveAddressCoordinatesWithInfo('Ring Road, Dikeni, 5700', {
      locality: 'Alice',
      fallbackQuery: 'Alice Campus',
      fallbackQueries: ['University of Fort Hare'],
      label: 'campus',
    })).resolves.toEqual({
      coordinates: { latitude: -32.7848724, longitude: 26.8501634 },
      usedFallback: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('q'))
      .toBe('Ring Road, Dikeni, 5700');
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('q'))
      .toBe('Ring Road, Dikeni, 5700, Alice, South Africa');
    expect(new URL(String(fetchMock.mock.calls[2][0])).searchParams.get('q'))
      .toBe('Alice Campus, Alice, South Africa');
    expect(new URL(String(fetchMock.mock.calls[3][0])).searchParams.get('q'))
      .toBe('University of Fort Hare, Alice, South Africa');
  });

  it('rejects an institution fallback geocoded outside the selected campus locality', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-26.2',
          lon: '28.0',
          display_name: 'University of Fort Hare, Johannesburg, Gauteng, South Africa',
        }],
      } as Response);

    await expect(resolveAddressCoordinates('Ring Road, Dikeni, 5700', {
      locality: 'Alice',
      fallbackQuery: 'Alice Campus',
      fallbackQueries: ['University of Fort Hare'],
      label: 'campus',
    })).rejects.toThrow(/could not find this campus/i);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('accepts a campus result matching the region when the city is named differently', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-25.7479',
          lon: '28.2293',
          display_name: 'University campus, City of Tshwane, Gauteng, South Africa',
        }],
      } as Response);

    await expect(resolveAddressCoordinates('University campus', {
      locality: 'Pretoria, Gauteng',
      fallbackQuery: 'Example University',
      label: 'campus',
    })).resolves.toEqual({ latitude: -25.7479, longitude: 28.2293 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('q'))
      .toBe('University campus, Pretoria, Gauteng, South Africa');
  });

  it('rejects a campus result that matches neither city nor region', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-26.2',
          lon: '28.0',
          display_name: 'University campus, Johannesburg, Gauteng, South Africa',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

    await expect(resolveAddressCoordinates('University campus', {
      locality: 'Kimberley, Northern Cape',
      fallbackQuery: 'Sol Plaatje University',
      label: 'campus',
    })).rejects.toThrow(/could not find this campus/i);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries an unmatched property address with the selected campus locality', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-25.601',
          lon: '28.012',
          display_name: '7381 Motsatsi Road, Ga-Rankuwa, City of Tshwane, Gauteng, South Africa',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-25.598',
          lon: '28.015',
          display_name: 'Sefako Makgatho Health Sciences University, Ga-Rankuwa, Gauteng, South Africa',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 'Ok', routes: [{ distance: 1500 }] }),
      } as Response);

    await expect(resolveListingLocation(
      '7381 Motsatsi Rd, Ga-Rankuwa Unit 6, Ga-Rankuwa, 0208',
      'Molotlegi Street, Ga-Rankuwa, Pretoria',
      { name: 'Sefako Makgatho Health Sciences University', locality: 'Ga-Rankuwa, Pretoria, Gauteng' }
    )).resolves.toEqual({
      latitude: -25.601,
      longitude: 28.012,
      distanceFromCampus: 1.5,
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('q'))
      .toBe('7381 Motsatsi Rd, Ga-Rankuwa Unit 6, Ga-Rankuwa, 0208');
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('q'))
      .toBe('7381 Motsatsi Rd, Ga-Rankuwa Unit 6, Ga-Rankuwa, 0208, Ga-Rankuwa, Pretoria, Gauteng, South Africa');
    expect(new URL(String(fetchMock.mock.calls[2][0])).searchParams.get('q'))
      .toBe('Molotlegi Street, Ga-Rankuwa, Pretoria');
  });

  it('selects a matching candidate when the first result omits the campus locality', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          lat: '-26.2',
          lon: '28.0',
          display_name: 'Motsatsi Road, Johannesburg, Gauteng, South Africa',
        },
        {
          lat: '-25.601',
          lon: '28.012',
          display_name: 'Motsatsi Road, Ga-Rankuwa, Gauteng, South Africa',
        },
      ],
    } as Response);

    await expect(resolveAddressCoordinates('Motsatsi Road', {
      locality: 'Ga-Rankuwa, Gauteng',
      label: 'property',
    })).resolves.toEqual({ latitude: -25.601, longitude: 28.012 });

    expect(new URL(String((global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0][0]))
      .searchParams.get('limit')).toBe('5');
  });

  it('rejects a property geocoding result outside the selected campus locality', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-26.2',
          lon: '28.0',
          display_name: 'Motsatsi Road, Johannesburg, Gauteng, South Africa',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-26.2',
          lon: '28.0',
          display_name: 'Motsatsi Road, Johannesburg, Gauteng, South Africa',
        }],
      } as Response);

    await expect(resolveListingLocation(
      'Motsatsi Road, Johannesburg',
      'Molotlegi Street, Ga-Rankuwa',
      { name: 'Sefako Makgatho Health Sciences University', locality: 'Ga-Rankuwa, Gauteng' }
    )).rejects.toThrow(/could not find this property address near the selected campus/i);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores fuzzy results outside the campus city or region', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-26.1853',
          lon: '27.9972',
          display_name: 'University campus, Gauteng, South Africa',
        }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: '-28.7451',
          lon: '24.7663',
          display_name: 'Sol Plaatje University (North Campus), Kimberley, Northern Cape, South Africa',
        }],
      } as Response);

    await expect(resolveAddressCoordinates('University campus', {
      locality: 'Kimberley, Northern Cape',
      fallbackQuery: 'Sol Plaatje University',
    })).resolves.toEqual({ latitude: -28.7451, longitude: 24.7663 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a campus lookup after a Nominatim rate-limit response', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

    await expect(resolveAddressCoordinates('University campus', {
      locality: 'Kimberley',
      fallbackQuery: 'Sol Plaatje University',
    })).rejects.toThrow(/busy or temporarily unavailable/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a route response without a valid distance', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '-25.75', lon: '28.2' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '-25.8', lon: '28.3' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 'NoRoute', routes: [] }),
      } as Response);

    await expect(calculateRouteDistanceKm('10 Main Road', 'Campus Avenue')).rejects.toThrow(/valid route distance/i);
  });
});
