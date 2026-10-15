import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {},
}));

import { getInstitutionSuggestions } from '../src/controllers/campus.controller';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('OpenAlex institution suggestions', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('queries the South African education catalog and returns matching universities', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            display_name: 'Tshwane University of Technology',
            country_code: 'ZA',
            type: 'education',
            homepage_url: 'https://tut.ac.za',
          },
          {
            display_name: 'Another South African University',
            country_code: 'ZA',
            type: 'education',
          },
        ],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions({ query: { search: 'ts' } } as unknown as Request, response);

    const url = new URL(fetchMock.mock.calls[0][0] as string | URL);
    expect(url.origin).toBe('https://api.openalex.org');
    expect(url.pathname).toBe('/institutions');
    expect(url.searchParams.get('filter')).toBe('country_code:ZA,type:education');
    expect(url.searchParams.get('per-page')).toBe('100');
    expect(url.searchParams.get('select')).toBe('display_name,country_code,type,homepage_url');
    expect((response.json as jest.Mock).mock.calls[0][0].data).toEqual([{
      name: 'Tshwane University of Technology',
      country: 'South Africa',
      countryCode: 'ZA',
      domains: ['tut.ac.za'],
      webPages: ['https://tut.ac.za'],
    }]);
  });

  it('returns a bounded catalog when search is omitted', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: Array.from({ length: 60 }, (_, index) => ({
          display_name: `South African University ${index}`,
          country_code: 'ZA',
          type: 'education',
        })),
      }),
    }) as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions({ query: {} } as unknown as Request, response);

    expect((response.json as jest.Mock).mock.calls[0][0].data).toHaveLength(50);
  });

  it('rejects invalid searches before requesting the provider', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions({ query: { search: 'x' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces upstream HTTP failures as a service error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Unavailable',
    }) as unknown as typeof fetch;
    const response = responseMock();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getInstitutionSuggestions({ query: { search: 'Tshwane' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
  });

  it('rejects malformed or out-of-scope provider records', async () => {
    for (const record of [
      { display_name: '', country_code: 'ZA', type: 'education' },
      { display_name: 'Example Organization', country_code: 'ZA', type: 'healthcare' },
      { display_name: 'Example University', country_code: 'US', type: 'education' },
    ]) {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [record] }),
      }) as unknown as typeof fetch;
      const response = responseMock();

      await getInstitutionSuggestions({ query: { search: 'Example' } } as unknown as Request, response);

      expect(response.status).toHaveBeenCalledWith(502);
    }
  });

  it('surfaces network failures as a service error', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network unavailable'));
    global.fetch = fetchMock as unknown as typeof fetch;
    const response = responseMock();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getInstitutionSuggestions({ query: { search: 'Tshwane' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
  });
});
