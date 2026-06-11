import request from 'supertest';
import app from '../src/app';
import db from '../src/models';

describe('Product Preorder & Channels API', () => {
  let token: string;
  let testProductId: number;
  let testChannelId: number;

  beforeAll(async () => {
    // Sync DB and get token
    await db.sequelize.sync({ force: true });
    
    await request(app).post('/api/auth/register').send({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123'
    });
    token = loginRes.body.data.token;

    // Create a channel
    const channelRes = await request(app)
      .post('/api/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WhatsApp' });
    testChannelId = channelRes.body.data.id;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('should create a preorder product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Buket Preorder',
        price: 200000,
        type: 'preorder',
        preorder_duration: 7
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('preorder');
    expect(res.body.data.preorder_duration).toBe(7);
    testProductId = res.body.data.id;
  });

  it('should set order channels for a product', async () => {
    const res = await request(app)
      .post(`/api/products/${testProductId}/channels`)
      .set('Authorization', `Bearer ${token}`)
      .send([
        { channel_id: testChannelId, store_url: 'https://wa.me/123' }
      ]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it('should include order channels in product details', async () => {
    const res = await request(app).get(`/api/products/${testProductId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.orderChannels).toBeDefined();
    expect(res.body.data.orderChannels.length).toBe(1);
    expect(res.body.data.orderChannels[0].name).toBe('WhatsApp');
  });
});
