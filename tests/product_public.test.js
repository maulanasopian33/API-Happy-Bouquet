const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

describe('Product Public API', () => {
  let testProductId;

  beforeAll(async () => {
    try {
      // Sync DB (like other tests do)
      await db.sequelize.sync({ force: true });
      
      // Create a test product with cost templates
      const product = await db.Product.create({
        name: 'Test Product for Public',
        slug: 'test-product-public',
        price: 100000,
        is_active: true
      });
      testProductId = product.id;

      await db.ProductCostTemplate.create({
        product_id: testProductId,
        name: 'Secret Material Cost',
        cost_type: 'material',
        amount: 50000
      });
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('should return products without costTemplates by default', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    
    // Find our test product in the list
    const product = res.body.data.find((p) => p.id === testProductId);
    expect(product).toBeDefined();
    expect(product.costTemplates).toBeUndefined();
  });

  it('should return product details without costTemplates by default', async () => {
    const res = await request(app).get('/api/products/slug/test-product-public');
    expect(res.status).toBe(200);
    expect(res.body.data.costTemplates).toBeUndefined();
  });

  it('should NOT return costTemplates to unauthenticated users even when include_costs=true is passed', async () => {
    const res = await request(app).get('/api/products?include_costs=true');
    expect(res.status).toBe(200);
    
    const product = res.body.data.find((p) => p.id === testProductId);
    expect(product).toBeDefined();
    expect(product.costTemplates).toBeUndefined();
  });

  it('should return costTemplates when admin provides valid token and include_costs=true', async () => {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test_jwt_secret_for_tests';
    process.env.JWT_SECRET = secret;
    const adminToken = jwt.sign({ id: 1, email: 'admin@hb.com', role: 'admin' }, secret, { expiresIn: '1h' });

    const res = await request(app)
      .get('/api/products?include_costs=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const product = res.body.data.find((p) => p.id === testProductId);
    expect(product).toBeDefined();
    expect(product.costTemplates).toBeDefined();
    expect(product.costTemplates.length).toBeGreaterThan(0);
  });
});
