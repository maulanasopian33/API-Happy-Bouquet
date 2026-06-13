import request from 'supertest';
import app from '../src/app';
import db from '../src/models';

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('Reseller API & Logic', () => {
  describe('POST /api/reseller/register', () => {
    it('should register a new reseller successfully with pending_review status', async () => {
      const res = await request(app)
        .post('/api/reseller/register')
        .send({
          name: 'Reseller Test',
          email: 'reseller@example.com',
          password: 'password123',
          shop_name: 'Toko Bunga Indah',
          slug: 'toko-bunga-indah',
          whatsapp_number: '628123456789',
          shop_bio: 'Menyediakan berbagai karangan bunga cantik.',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe(true);
      expect(res.body.data).toHaveProperty('slug', 'toko-bunga-indah');
      expect(res.body.data).toHaveProperty('status', 'pending_review');
    });

    it('should fail registration if slug contains invalid characters', async () => {
      const res = await request(app)
        .post('/api/reseller/register')
        .send({
          name: 'Reseller Test',
          email: 'reseller2@example.com',
          password: 'password123',
          shop_name: 'Toko Bunga Indah',
          slug: 'Toko_Bunga_Indah!', // invalid characters and uppercase
          whatsapp_number: '628123456789',
        });

      expect(res.statusCode).toEqual(422);
      expect(res.body.status).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/catalog/:slug/whatsapp-link/:productId', () => {
    let resellerId: number;
    let productId: number;

    beforeAll(async () => {
      // Create active reseller directly in DB
      const user = await db.User.create({
        name: 'Active Reseller',
        email: 'activereseller@example.com',
        password: 'password123',
        role: 'reseller',
      });

      const reseller = await db.Reseller.create({
        user_id: user.id,
        slug: 'active-shop',
        shop_name: 'Active Shop',
        whatsapp_number: '628987654321',
        tier: 'gold',
        status: 'active',
        is_catalog_public: true,
      });
      resellerId = reseller.id;

      await db.ResellerWhatsappTemplate.create({
        reseller_id: reseller.id,
        template: 'Halo {reseller_name}, mau pesan {product_name} seharga Rp {price}',
      });

      // Create product
      const category = await db.Category.create({
        name: 'Hand Bouquet',
      });

      const product = await db.Product.create({
        name: 'Mawar Merah',
        slug: 'mawar-merah',
        price: 150000,
        category_id: category.id,
        is_active: true,
      });
      productId = product.id;

      await db.ResellerProductVisibility.create({
        product_id: product.id,
        is_resellable: true,
      });
    });

    it('should compile template and return correct wa.me link', async () => {
      const res = await request(app).get(`/api/catalog/active-shop/whatsapp-link/${productId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data).toHaveProperty('whatsapp_url');
      expect(res.body.data.whatsapp_url).toContain('https://wa.me/628987654321');
      expect(res.body.data.whatsapp_url).toContain(encodeURIComponent('Mawar Merah'));
      expect(res.body.data.message_preview).toBe('Halo Active Reseller, mau pesan Mawar Merah seharga Rp 150.000');
    });

    it('should fail to generate link if reseller slug does not exist', async () => {
      const res = await request(app).get(`/api/catalog/non-existent-shop/whatsapp-link/${productId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toBe(false);
    });
  });
});
