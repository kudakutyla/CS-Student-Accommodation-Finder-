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

describe('Hipolabs institution suggestions', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('queries South African suggestions and returns only normalized suggestion data', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        name: 'Example University',
        country: 'South Africa',
        alpha_two_code: 'ZA',
        domains: ['example.ac.za'],
        web_pages: ['https://example.ac.za'],
      }],
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const response = responseMock();

    await getInstitutionSuggestions(
      { query: { search: 'Example' } } as unknown as Request,
      response
    );

    const url = new URL(fetchMock.mock.calls[0][0] as string | URL);
    expect(url.origin).toBe('https://universities.hipolabs.com');
    expect(url.searchParams.get('country')).toBe('South Africa');
    expect(url.searchParams.get('name')).toBe('Example');
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

    await getInstitutionSuggestions({ query: { search: 'Example' } } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(503);
  });
});
