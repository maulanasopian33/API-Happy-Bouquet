import request from 'supertest';
import app from '../src/app';
import db from '../src/models';
import bcrypt from 'bcryptjs';

describe('Customers API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Buat admin langsung (registerSchema men-strip role)
    await db.User.create({
      name: 'Admin Satu',
      email: 'admin@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('harus membuat customer baru (POST /api/customers)', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Budi Santoso',
        email: 'budi@test.com',
        phone: '081234567890',
        address: 'Jl. Melati No. 1',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(true);
    expect(res.body.data.role).toBe('customer');
    expect(res.body.data.password).toBeUndefined();
  });

  it('harus menolak customer dengan email duplikat', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Budi Santoso',
        email: 'budi@test.com',
      });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe(false);
  });

  it('harus menolak akses non-admin ke POST /api/customers', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Customer Biasa',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer',
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'customer@test.com',
      password: 'password123',
    });
    const customerToken = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Orang Lain',
        email: 'orang@test.com',
      });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe(false);
    expect(res.body.error.code).toBeDefined();
  });

  it('harus menolak akses tanpa token', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.error.code).toBeDefined();
  });
});
