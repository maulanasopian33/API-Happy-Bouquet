const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const bcrypt = require('bcryptjs');

describe('Store Settings API — GET/PUT /api/settings', () => {
  let adminToken;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await db.User.create({
      name: 'Admin Settings',
      email: 'admin@settings.test',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@settings.test',
      password: 'password123',
    });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('GET publik mengembalikan objek settings tanpa auth', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(typeof res.body.data).toBe('object');
    expect(res.body.data).not.toBeNull();
  });

  it('PUT tanpa token ditolak 401', async () => {
    const res = await request(app).put('/api/settings').send({ brand_name: 'Hacked' });
    expect(res.status).toBe(401);
  });

  it('PUT oleh admin lalu GET mengembalikan nilai terbaru', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ brand_name: 'HappyBouquet Test', whatsapp_number: '628111111111' });
    expect(res.status).toBe(200);
    expect(res.body.data.brand_name).toBe('HappyBouquet Test');
    expect(res.body.data.whatsapp_number).toBe('628111111111');

    const get = await request(app).get('/api/settings');
    expect(get.status).toBe(200);
    expect(get.body.data.brand_name).toBe('HappyBouquet Test');
    expect(get.body.data.whatsapp_number).toBe('628111111111');
  });

  it('PUT value non-string ditolak 422', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ brand_name: 123 });
    expect(res.status).toBe(422);
  });

  it('key di luar allowlist di-strip dari respons', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ unknown_field: 'hack', brand_name: 'Aman' });
    expect(res.status).toBe(200);
    expect(res.body.data.unknown_field).toBeUndefined();
    expect(res.body.data.brand_name).toBe('Aman');
  });
});

describe('Alias /api/analytics/collect (path storefront)', () => {
  it('route ter-mount: payload invalid -> 400, bukan 404', async () => {
    const res = await request(app).post('/api/analytics/collect').send({});
    expect(res.status).toBe(400);
  });
});
