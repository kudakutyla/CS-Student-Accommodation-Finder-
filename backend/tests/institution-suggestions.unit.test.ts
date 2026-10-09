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

  it('queries the bounded South African education catalog and matches partial names', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{
          display_name: 'Tshwane University of Technology',
          country_code: 'ZA',
          type: 'education',
          homepage_url: 'https://tut.ac.za',
        }, {
          display_name: 'Another Institution',
          country_code: 'ZA',
          type: 'education',
        }],
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
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect((response.json as jest.Mock).mock.calls[0][0].data).toEqual([{
      name: 'Tshwane University of Technology',
      country: 'South Africa',
      countryCode: 'ZA',
      domains: ['tut.ac.za'],
      webPages: ['https://tut.ac.za'],
    }]);
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
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Unavailable' }) as unknown as typeof fetch;
    const response = responseMock();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getInstitutionSuggestions({ query: { search: 'Tshwane' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
  });

  it('rejects malformed provider records', async () => {
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

    await getInstitutionSuggestions({ query: { search: 'Tshwane' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(502);
  });

  it('surfaces network failures as a service error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable')) as unknown as typeof fetch;
    const response = responseMock();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getInstitutionSuggestions({ query: { search: 'Tshwane' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
  });
});
