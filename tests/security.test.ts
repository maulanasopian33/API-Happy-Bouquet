import request from 'supertest';
import app from '../src/app';

describe('Security Configuration', () => {
  it('should have "trust proxy" set to 1 or true', () => {
    const trustProxy = app.get('trust proxy');
    // It should be truthy as we set it to 1
    expect(trustProxy).toBeTruthy();
    expect([1, true]).toContain(trustProxy);
  });

  it('should respond successfully with rate limiter enabled', async () => {
    // This basic test ensures the rate limiter doesn't crash the app
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Welcome to Happy Bouquet API');
  });

  it('should respect X-Forwarded-For when trust proxy is enabled', async () => {
    // We can't easily test the rate limit block here without many requests,
    // but we can verify the app doesn't throw the ValidationError
    // when X-Forwarded-For is present.
    const res = await request(app)
      .get('/')
      .set('X-Forwarded-For', '1.2.3.4');
    
    expect(res.statusCode).toEqual(200);
  });
});
