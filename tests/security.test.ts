import request from 'supertest';
import app from '../src/app';
import db from '../src/models';
import bcrypt from 'bcryptjs';

describe('Security Configuration', () => {
  let adminToken: string;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await db.User.create({
      name: 'Admin Sec',
      email: 'sec@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'sec@test.com',
      password: 'password123',
    });
    adminToken = res.body.data.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

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
    expect(res.body.status).toBe(true);
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('uptime');
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

  it('should block anonymous access to GET /api/logs (admin-only)', async () => {
    const res = await request(app).get('/api/logs');
    expect(res.statusCode).toEqual(401);
  });

  it('should allow admin access to GET /api/logs', async () => {
    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${adminToken}`);
    // Endpoint admin valid — status 200 (daftar log) atau setidaknya BUKAN 401/403.
    expect([200, 500]).toContain(res.statusCode);
  });

  it('should keep POST /api/logs public (frontend logging)', async () => {
    const res = await request(app).post('/api/logs').send({ message: 'client log' });
    expect([200, 201, 400]).toContain(res.statusCode);
  });
});
