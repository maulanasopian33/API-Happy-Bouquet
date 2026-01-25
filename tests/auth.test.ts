import request from 'supertest';
import app from '../src/app';
import db from '../src/models';

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('Authentication API', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.data).toHaveProperty('email', 'test@example.com');
  });

  it('should not register a user with existing email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User 2',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe('Email already registered');
  });

  it('should login a user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data).toHaveProperty('token');
  });

  it('should not login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe('Invalid credentials');
  });
});
