import db from '../src/models';
import * as orderService from '../src/services/orderService';
import * as fundService from '../src/services/fundService';

describe('Order Lifecycle and Financial Integration', () => {
  let customerId: number;
  let productId: number;

  beforeEach(async () => {
    await db.sequelize.sync({ force: true });

    const user = await db.User.create({
      name: 'Order Tester',
      email: 'order@test.com',
      password: 'password',
      role: 'customer'
    });
    customerId = user.id;

    const product = await db.Product.create({
      name: 'Super Bouquet',
      price: 200000,
      is_active: true
    });
    productId = product.id;

    await db.Material.create({
      name: 'Rose Red',
      category: 'flower',
      unit: 'stem',
      price_per_unit: 5000,
      stock: 15,
      min_stock: 5,
      photo_url: 'test.jpg'
    });

    await db.ProductCostTemplate.bulkCreate([
      { product_id: productId, name: 'Rose Red x10', cost_type: 'material', amount: 50000 },
      { product_id: productId, name: 'Worker', cost_type: 'labor', amount: 40000 },
    ]);

    await db.FundAccount.bulkCreate([
      { name: 'Modal Usaha', fund_type: 'capital', balance: 1000000 },
      { name: 'Dana Fee Pekerja', fund_type: 'worker_fee', balance: 0 },
    ]);
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('harus gagal membuat order jika stok tidak cukup', async () => {
    // Quantity 2 x 10 = 20 (Needed) > 15 (Stock)
    await expect(orderService.createOrder({
      customer_id: customerId,
      product_id: productId,
      quantity: 2
    })).rejects.toThrow(/Stok bahan baku tidak mencukupi/);
  });

  it('harus berhasil membuat order jika stok cukup', async () => {
    const order = await orderService.createOrder({
      customer_id: customerId,
      product_id: productId,
      quantity: 1
    });

    expect(order.status).toBe('pending');
    expect(order.order_code).toMatch(/^ORD-/);
  });

  it('harus menjalankan alur lengkap: Konfirmasi -> Potong Stok -> Kredit Modal -> Bayar Fee', async () => {
    // 1. Persiapan Order
    const order = await orderService.createOrder({
      customer_id: customerId,
      product_id: productId,
      quantity: 1
    });

    const initialStock = (await db.Material.findOne({ where: { name: 'Rose Red' } }))!.stock;
    const capitalAccount = await db.FundAccount.findOne({ where: { fund_type: 'capital' } });
    const initialCapital = Number(capitalAccount!.balance);
    const workerFund = await db.FundAccount.findOne({ where: { fund_type: 'worker_fee' } });
    const initialWorkerFee = Number(workerFund!.balance);

    // 2. Konfirmasi Pembayaran
    await orderService.confirmPayment(order.id);

    // -- Cek Stok --
    const updatedMaterial = await db.Material.findOne({ where: { name: 'Rose Red' } });
    expect(updatedMaterial!.stock).toBe(initialStock - 10);

    // -- Cek Modal (Revenue 200k - COGS 50k = +150k) --
    const updatedCapital = await db.FundAccount.findOne({ where: { fund_type: 'capital' } });
    expect(Number(updatedCapital!.balance)).toBe(initialCapital + 150000);

    // -- Cek Dana Pekerja (Snapshot +40k) --
    const updatedWorkerFund = await db.FundAccount.findOne({ where: { fund_type: 'worker_fee' } });
    expect(Number(updatedWorkerFund!.balance)).toBe(initialWorkerFee + 40000);

    // 3. Bayar Fee Pekerja
    await orderService.payWorkerFees(order.id);

    // -- Cek Dana Pekerja (Kembali ke initial karena 40k dibayar) --
    const finalWorkerFund = await db.FundAccount.findOne({ where: { fund_type: 'worker_fee' } });
    expect(Number(finalWorkerFund!.balance)).toBe(initialWorkerFee);

    // -- Cek Status Cost Item --
    const costItems = await db.OrderCostItem.findAll({ where: { order_id: order.id, cost_type: 'labor' } });
    expect(costItems.every(c => c.is_paid === true)).toBe(true);
  });
});
