const request = require('supertest');
const app = require('../src/app');

describe('Root API Info (GET /)', () => {
  it('should return professional API info with 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe(true);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toMatchObject({
      name: 'api-happybouquet',
      version: expect.any(String),
      status: 'ok',
      env: expect.any(String),
      endpoints: expect.any(Array),
      timestamp: expect.any(String),
    });
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data.endpoints).toContain('/api/auth');
  });

  it('should not leak sensitive information', async () => {
    const res = await request(app).get('/');
    const serialized = JSON.stringify(res.body);
    const sensitive = [
      'password',
      'secret',
      'JWT_SECRET',
      'DB_PASSWORD',
      'DB_USER',
      'ENCRYPTION_KEY',
      'REDIS',
      'mysql://',
    ];
    for (const term of sensitive) {
      expect(serialized.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});

describe('Health Check (GET /health)', () => {
  it('should return ok with uptime & runtime basics', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data).toMatchObject({
      nodeVersion: expect.stringMatching(/^v\d+/),
      platform: expect.any(String),
      arch: expect.any(String),
      env: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it('should set Cache-Control: no-store for fresh monitoring checks', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
