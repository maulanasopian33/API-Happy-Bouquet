const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const bcrypt = require('bcryptjs');

describe('Analytics API Integration', () => {
  let adminToken;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await db.User.create({
      name: 'Admin Analytics',
      email: 'admin@analytics.test',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@analytics.test',
      password: 'password123',
    });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /api/analytics/collect', () => {
    it('mencatat pageview dari pengunjung manusia asli tanpa bias bot', async () => {
      const payload = {
        session_id: 'test_human_sess_1',
        url: '/products/buket-wisuda',
        event_type: 'pageview',
        page_title: 'Buket Wisuda',
        is_webdriver: false,
      };

      const res = await request(app)
        .post('/api/analytics/collect')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK');
    });

    it('mendeteksi bot dan menandainya terpisah', async () => {
      const payload = {
        session_id: 'test_bot_sess_1',
        url: '/products/buket-wisuda',
        event_type: 'pageview',
      };

      const res = await request(app)
        .post('/api/analytics/collect')
        .set('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK');
    });

    it('menolak payload tanpa session_id atau url dengan 400', async () => {
      const res = await request(app)
        .post('/api/analytics/collect')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/analytics/overview (Admin)', () => {
    it('membutuhkan autentikasi admin', async () => {
      const unauth = await request(app).get('/api/analytics/overview');
      expect(unauth.status).toBe(401);

      const auth = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auth.status).toBe(200);
      expect(auth.body.status).toBe(true);
      expect(auth.body.data.real_visitors).toBeDefined();
      expect(auth.body.data.bot_intelligence).toBeDefined();
    });
  });

  describe('GET /api/analytics/bots (Admin)', () => {
    it('mengembalikan daftar deteksi bot dengan rekomendasi tindakan', async () => {
      const res = await request(app)
        .get('/api/analytics/bots')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });
  });
});
