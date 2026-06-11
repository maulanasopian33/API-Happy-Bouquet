import request from 'supertest';
import app from '../src/app';
import db from '../src/models';

describe('Product Public API', () => {
  let testProductId: number;

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
    const product = res.body.data.find((p: any) => p.id === testProductId);
    expect(product).toBeDefined();
    expect(product.costTemplates).toBeUndefined();
  });

  it('should return product details without costTemplates by default', async () => {
    const res = await request(app).get(`/api/products/${testProductId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.costTemplates).toBeUndefined();
  });

  it('should return products with costTemplates when include_costs=true is passed', async () => {
    const res = await request(app).get('/api/products?include_costs=true');
    expect(res.status).toBe(200);
    
    const product = res.body.data.find((p: any) => p.id === testProductId);
    expect(product).toBeDefined();
    expect(product.costTemplates).toBeDefined();
    expect(product.costTemplates.length).toBeGreaterThan(0);
  });
});
