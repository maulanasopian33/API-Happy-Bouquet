const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

// Bersihkan tabel PublicOrders sebelum tiap test
beforeEach(async () => {
  await db.sequelize.sync({ force: false });
  await db.PublicOrder.destroy({ where: {}, truncate: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('POST /api/orders/public — buat pesanan dari web', () => {
  const validPayload = {
    customer_name: 'Budi Santoso',
    customer_phone: '081234567890',
    delivery_address: 'Jl. Melati No. 5',
    items: [{ name: 'Buket Mawar Merah', qty: 1, price: 350000 }],
    payment_type: 'dp',
  };

  it('berhasil buat pesanan, return order_number format HB-DDMMYY-XXXX', async () => {
    const res = await request(app).post('/api/orders/public').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.order_number).toMatch(/^HB-\d{6}-\d{4}$/);
  });

  it('tolak jika customer_name kosong', async () => {
    const res = await request(app).post('/api/orders/public').send({ ...validPayload, customer_name: '' });
    expect(res.status).toBe(422);
  });

  it('tolak jika items kosong', async () => {
    const res = await request(app).post('/api/orders/public').send({ ...validPayload, items: [] });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/orders/track/:orderNumber — cek status pesanan', () => {
  it('404 jika format nomor salah', async () => {
    const res = await request(app).get('/api/orders/track/INVALID-123');
    expect(res.status).toBe(404);
  });

  it('404 jika nomor tidak ada di DB', async () => {
    const res = await request(app).get('/api/orders/track/HB-010101-9999');
    expect(res.status).toBe(404);
  });

  it('return data publik (masking nama, tanpa harga item)', async () => {
    // Buat order dulu langsung ke DB
    await db.PublicOrder.create({
      order_number: 'HB-010125-1234',
      customer_name: 'Siti Rahayu',
      customer_phone: '082111222333',
      items: [{ name: 'Buket Tulip', qty: 2, price: 200000 }],
      total_price: 400000,
      channel: 'Web',
      status: 'confirmed',
    });

    const res = await request(app).get('/api/orders/track/HB-010125-1234');
    expect(res.status).toBe(200);
    expect(res.body.data.customer_name).toBe('Sit***');
    // Harga item tidak boleh terekspos
    expect(res.body.data.items[0].price).toBeUndefined();
    expect(res.body.data.items[0].name).toBe('Buket Tulip');
  });
});

