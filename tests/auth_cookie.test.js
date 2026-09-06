const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const bcrypt = require('bcryptjs');

describe('Cookie Auth (Dual-mode) & CSRF', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    await db.User.create({
      name: 'Admin Cookie',
      email: 'cookie@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('harus mengembalikan token di body DAN mengeset cookie hb_token saat login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'cookie@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    const cookies = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : [res.headers['set-cookie']];
    const cookie = cookies.find((c) => c.startsWith('hb_token='));
    expect(cookie).toBeDefined();
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('harus mengautentikasi via cookie saja (tanpa Bearer header)', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'cookie@test.com',
      password: 'password123',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('cookie@test.com');
  });

  it('harus tetap menerima Bearer token (dual-mode, untuk storefront)', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'cookie@test.com',
      password: 'password123',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('cookie@test.com');
  });

  it('harus menolak method mutasi berbasis cookie tanpa header X-Requested-With (CSRF)', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'cookie@test.com',
      password: 'password123',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', cookies)
      .send({ name: 'Buket CSRF', price: 100000 });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('harus menerima method mutasi berbasis cookie DENGAN header X-Requested-With', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'cookie@test.com',
      password: 'password123',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', cookies)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ name: 'Buket CSRF OK', slug: 'buket-csrf-ok', price: 100000, is_active: true });

    // Harus lolos CSRF; status mungkin 201 (berhasil) — jika gagal validasi lain,
    // pastikan BUKAN 403 CSRF.
    expect(res.status).not.toBe(403);
  });

  it('logout harus menghapus cookie', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'cookie@test.com',
      password: 'password123',
    });
    const cookies = Array.isArray(loginRes.headers['set-cookie'])
      ? loginRes.headers['set-cookie']
      : [loginRes.headers['set-cookie']];

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(200);
    const cleared = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : [res.headers['set-cookie']];
    const clearCookie = cleared.find((c) => c.startsWith('hb_token='));
    // Node/Express menampilkan cookie yang dihapus sebagai Expires di masa lalu
    // (bukan Max-Age=0). Terima kedua representasi.
    const isCleared = clearCookie.includes('Max-Age=0') || clearCookie.includes('Thu, 01 Jan 1970');
    expect(isCleared).toBe(true);
  });
});
