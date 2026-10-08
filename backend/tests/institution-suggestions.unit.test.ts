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

  it('queries South African education institutions over HTTPS and normalizes suggestion data', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{
          display_name: 'Example University',
          country_code: 'ZA',
          type: 'education',
          homepage_url: 'https://example.ac.za',
        }, {
          display_name: 'Another South African University',
          country_code: 'ZA',
          type: 'education',
        }],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions(
      { query: { search: 'Example' } } as unknown as Request,
      response
    );

    const url = new URL(fetchMock.mock.calls[0][0] as string | URL);
    expect(url.origin).toBe('https://api.openalex.org');
    expect(url.pathname).toBe('/institutions');
    expect(url.searchParams.get('filter')).toBe('country_code:ZA,type:education');
    expect(url.searchParams.has('search')).toBe(false);
    expect(url.searchParams.get('per-page')).toBe('100');
    expect(url.searchParams.get('select')).toBe('display_name,country_code,type,homepage_url');
    expect((response.json as jest.Mock).mock.calls[0][0].data).toEqual([{
      name: 'Example University',
      country: 'South Africa',
      countryCode: 'ZA',
      domains: ['example.ac.za'],
      webPages: ['https://example.ac.za'],
    }]);
  });

  it('surfaces upstream failures as a service error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const response = responseMock();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getInstitutionSuggestions({ query: { search: 'Example' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
  });

  it('rejects invalid searches before calling the provider', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions({ query: { search: 'x' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects non-OpenAlex upstream data instead of returning an empty success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{
          display_name: '',
          country_code: 'ZA',
          type: 'education',
        }],
      }),
    }) as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions({ query: { search: 'Example' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(502);
  });

  it('rejects non-education or non-South-African upstream records', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{
          display_name: 'Example Organization',
          country_code: 'ZA',
          type: 'healthcare',
        }],
      }),
    }) as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions({ query: { search: 'Example' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(502);
  });

  it('surfaces network failures as a service error', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network unavailable'));
    global.fetch = fetchMock as unknown as typeof fetch;
    const response = responseMock();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getInstitutionSuggestions({ query: { search: 'Example' } } as unknown as Request, response);

    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(response.status).toHaveBeenCalledWith(503);
  });

  it('matches short input as a substring and caps the suggestion list at 50 records', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: Array.from({ length: 60 }, (_, index) => ({
          display_name: `Tshwane University ${index}`,
          country_code: 'ZA',
          type: 'education',
        })).concat([{
          display_name: 'Another Institution',
          country_code: 'ZA',
          type: 'education',
        }]),
      }),
    }) as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions({ query: { search: 'ts' } } as unknown as Request, response);

    expect((response.json as jest.Mock).mock.calls[0][0].data).toHaveLength(50);
    expect((response.json as jest.Mock).mock.calls[0][0].data[0].name).toBe('Tshwane University 0');
  });
});
