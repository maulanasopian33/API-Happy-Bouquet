import db from '../src/models';
import { calculateOrderProfit } from '../src/services/profitService';
import * as orderService from '../src/services/orderService';
import * as productService from '../src/services/productService';

describe('Profit Service Integration', () => {
  let customerId: number;
  let productId: number;
  let orderId: number;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // 1. Create Customer
    const user = await db.User.create({
      name: 'Customer Test',
      email: 'customer@test.com',
      password: 'hash',
      role: 'customer'
    });
    customerId = user.id;

    // 2. Create Product
    const product = await db.Product.create({
      name: 'Buket Mawar Test',
      description: 'Test Description',
      price: 100000,
      is_active: true
    });
    productId = product.id;

    // 3. Add Cost Templates
    await db.ProductCostTemplate.bulkCreate([
      { product_id: productId, name: 'Mawar', cost_type: 'material', amount: 30000 },
      { product_id: productId, name: 'Kertas', cost_type: 'material', amount: 10000 },
      { product_id: productId, name: 'Overhead', cost_type: 'overhead', amount: 5000 },
      { product_id: productId, name: 'Jasa', cost_type: 'labor', amount: 15000 },
    ]);

    // Initialize Fund Accounts (Capital, Worker Fee) - usually done by seeder but we do it manually here
    await db.FundAccount.bulkCreate([
      { name: 'Modal Usaha', fund_type: 'capital', balance: 1000000 },
      { name: 'Dana Fee Pekerja', fund_type: 'worker_fee', balance: 0 },
    ]);
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('harus menghitung profit dengan benar setelah pembayaran dikonfirmasi', async () => {
    // 1. Create Order
    const order = await orderService.createOrder({
      customer_id: customerId,
      product_id: productId,
      quantity: 1,
      notes: 'Test note'
    });
    orderId = order.id;

    // 2. Confirm Payment (Snapshot happens here)
    await orderService.confirmPayment(orderId);

    // 3. Calculate Profit
    const profit = await calculateOrderProfit(orderId);

    // Revenue: 100,000
    // COGS (material + overhead): 30,000 + 10,000 + 5,000 = 45,000
    // Labor: 15,000
    // Gross Profit: 100,000 - 45,000 = 55,000
    // Net Profit: 55,000 - 15,000 = 40,000

    expect(profit.revenue).toBe(100000);
    expect(profit.cogs).toBe(45000);
    expect(profit.laborCost).toBe(15000);
    expect(profit.grossProfit).toBe(55000);
    expect(profit.netProfit).toBe(40000);
  });

  it('harus menghitung profit berlipat jika quantity > 1', async () => {
     // 1. Create Order with Qty 2
     const order = await orderService.createOrder({
      customer_id: customerId,
      product_id: productId,
      quantity: 2,
      notes: 'Test note 2'
    });
    
    await orderService.confirmPayment(order.id);
    const profit = await calculateOrderProfit(order.id);

    // Revenue: 200,000
    // COGS: 45,000 * 2 = 90,000
    // Labor: 15,000 * 2 = 30,000
    // Gross: 110,000
    // Net: 80,000

    expect(profit.revenue).toBe(200000);
    expect(profit.netProfit).toBe(80000);
  });
});
