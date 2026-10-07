import request from 'supertest';
import app from '../src/app';

const productionOrigin = 'https://cs-student-accommodation-finder.vercel.app';

describe('CORS configuration', () => {
  it('allows auth preflight requests from the deployed frontend', async () => {
    const response = await request(app)
      .options('/api/auth/register')
      .set('Origin', productionOrigin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(productionOrigin);
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
