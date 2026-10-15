import request from 'supertest';
import app from '../src/app';

const productionOrigins = [
  'https://cs-student-accommodation-finder-mbc.vercel.app',
  'https://cs-student-accommodation-finder.vercel.app',
];

describe('CORS configuration', () => {
  it.each(productionOrigins)('allows auth preflight requests from %s', async (origin) => {
    const response = await request(app)
      .options('/api/auth/register')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain('content-type');
  });

  it('does not grant CORS access to an unrelated origin', async () => {
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://attacker.invalid')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
