const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

let token;
const testImagePath = path.join(__dirname, 'test_image.png');

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
  
  // Buat admin langsung (registerSchema men-strip role, sehingga role tidak bisa
  // diset lewat /api/auth/register).
  await db.User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: await bcrypt.hash('password123', 10),
    role: 'admin',
  });
  
  const res = await request(app).post('/api/auth/login').send({
    email: 'admin@example.com',
    password: 'password123',
  });
  token = res.body.data.token;

  // Create a dummy image file for testing
  fs.writeFileSync(testImagePath, 'dummy content');
});

afterAll(async () => {
  await db.sequelize.close();
  // Clean up dummy image
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
});

describe('Material API', () => {
  let materialId;

  it('should create a new material with photo', async () => {
    const res = await request(app)
      .post('/api/materials')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Red Rose')
      .field('unit', 'stem')
      .field('category', 'Flower')
      .field('price_per_unit', 5000)
      .field('stock', 100)
      .field('min_stock', 10)
      .attach('photo', testImagePath);

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('Red Rose');
    expect(res.body.data.photo_url).toContain('/public/uploads/materials/');
    
    materialId = res.body.data.id;
  });

  it('should get all materials', async () => {
    const res = await request(app)
      .get('/api/materials')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get material by id', async () => {
    const res = await request(app)
      .get(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.id).toBe(materialId);
  });

  it('should update material', async () => {
    const res = await request(app)
      .put(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Red Rose Updated')
      .field('stock', 50);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.name).toBe('Red Rose Updated');
    expect(res.body.data.stock).toBe(50);
  });

  it('should delete material', async () => {
    const res = await request(app)
      .delete(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe('Material deleted successfully');
  });
});
