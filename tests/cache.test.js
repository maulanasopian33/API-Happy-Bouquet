const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const bcrypt = require('bcryptjs');

// Regresi BUG: controller membungkus input schema ({query}/{params}/{body})
// tapi mem-parse req polos — semua endpoint cache valid selalu 400 VALIDATION_ERROR.
describe('Cache Admin API — /api/cache (validasi bungkus input)', () => {
  let adminToken;
  const KEY = 'test:cache:regression';

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await db.User.create({
      name: 'Admin Cache',
      email: 'admin@cache.test',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@cache.test',
      password: 'password123',
    });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await request(app)
      .delete(`/api/cache/keys/${KEY}`)
      .set('Authorization', `Bearer ${adminToken}`);
    await db.sequelize.close();
  });

  it('GET /keys tanpa token ditolak 401', async () => {
    const res = await request(app).get('/api/cache/keys');
    expect(res.status).toBe(401);
  });

  it('GET /keys dengan query valid -> 200 (sebelumnya 400 VALIDATION_ERROR path query)', async () => {
    const res = await request(app)
      .get('/api/cache/keys')
      .query({ pattern: '*', limit: 10 })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(Array.isArray(res.body.data.keys)).toBe(true);
  });

  it('POST /keys lalu GET /keys/:key -> 200 (sebelumnya 400 path body/params)', async () => {
    const set = await request(app)
      .post('/api/cache/keys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: KEY, value: 'nilai-uji', ttl: 120 });
    expect(set.status).toBe(200);

    const get = await request(app)
      .get(`/api/cache/keys/${KEY}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(get.status).toBe(200);
    expect(get.body.data.value).toBe('nilai-uji');
  });

  it('GET /keys/:key/ttl lalu DELETE /keys/:key -> 200', async () => {
    const ttl = await request(app)
      .get(`/api/cache/keys/${KEY}/ttl`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ttl.status).toBe(200);
    expect(ttl.body.data.ttl).toBeGreaterThan(0);

    const del = await request(app)
      .delete(`/api/cache/keys/${KEY}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    expect(del.body.data.deleted).toBe(true);
  });

  it('POST /keys/:key/expire -> 200 (jalur yang sudah benar tetap jalan)', async () => {
    await request(app)
      .post('/api/cache/keys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: KEY, value: 'x' });
    const res = await request(app)
      .post(`/api/cache/keys/${KEY}/expire`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ttl: 60 });
    expect(res.status).toBe(200);
    expect(res.body.data.expired).toBe(true);
  });

  it('GET /keys dengan limit bukan angka tetap 400 (validasi tidak dilepas)', async () => {
    const res = await request(app)
      .get('/api/cache/keys')
      .query({ limit: 'abc' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
