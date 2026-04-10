import db from '../models';
import logger from '../utils/logger';
import { creditFund, debitFund } from './fundService';

const Order = db.Order;
const Product = db.Product;
const ProductCostTemplate = db.ProductCostTemplate;
const OrderCostItem = db.OrderCostItem;
const sequelize = db.sequelize;

// ─── Helper: Generate kode order unik ────────────────────────────

const generateOrderCode = async (): Promise<string> => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Order.count();
  const seq = String(count + 1).padStart(3, '0');
  return `ORD-${dateStr}-${seq}`;
};

// ─── Buat Order Baru ─────────────────────────────────────────────

export const createOrder = async (data: {
  customer_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
}) => {
  const product = await Product.findByPk(data.product_id);
  if (!product) throw new Error('Produk tidak ditemukan');
  if (!product.is_active) throw new Error('Produk tidak aktif, tidak bisa dipesan');

  // --- Stock Validation ---
  const templates = await ProductCostTemplate.findAll({
    where: { product_id: data.product_id }
  });

  for (const tpl of templates) {
    if (tpl.cost_type === 'material') {
      const match = tpl.name.match(/(.+) x(\d+)$/);
      if (match) {
        const matName = match[1].trim();
        const itemQty = parseInt(match[2], 10);
        const totalNeeded = itemQty * data.quantity;

        const material = await db.Material.findOne({ where: { name: matName } });
        if (material && material.stock < totalNeeded) {
          throw new Error(`Stok bahan baku tidak mencukupi: ${matName} (Butuh: ${totalNeeded}, Ada: ${material.stock})`);
        }
      }
    }
  }

  const total_price = Number(product.price) * data.quantity;
  const order_code = await generateOrderCode();

  const order = await Order.create({
    ...data,
    order_code,
    total_price,
    status: 'pending',
    payment_status: 'unpaid',
  });

  logger.info('Order berhasil dibuat (lulus validasi stok)', { orderId: order.id, order_code, total_price });
  return order;
};

// ─── Ambil semua Order (dengan pagination) ───────────────────────

export const getAllOrders = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Order.findAndCountAll({
    include: [
      { model: Product, as: 'product' },
      { model: db.User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { orders: rows, total: count, page, totalPages: Math.ceil(count / limit) };
};

// ─── Ambil Order by ID ───────────────────────────────────────────

export const getOrderById = async (id: number) => {
  const order = await Order.findByPk(id, {
    include: [
      { model: Product, as: 'product' },
      { model: db.User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
      { model: OrderCostItem, as: 'costItems' },
    ],
  });
  if (!order) throw new Error('Order tidak ditemukan');
  return order;
};

// ─── Konfirmasi Pembayaran (INTI KEUANGAN) ───────────────────────
// Semua aksi dijalankan dalam 1 Sequelize Transaction (atomik)

export const confirmPayment = async (orderId: number) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: Product, as: 'product' }],
      transaction: t,
    });
    if (!order) throw new Error('Order tidak ditemukan');
    if (order.payment_status === 'paid') throw new Error('Pembayaran sudah dikonfirmasi sebelumnya');
    if (order.status === 'cancelled') throw new Error('Order sudah dibatalkan');

    // 1. Update status order
    await order.update({ payment_status: 'paid', status: 'confirmed' }, { transaction: t });

    // 2. Ambil template biaya produk
    const templates = await ProductCostTemplate.findAll({
      where: { product_id: order.product_id },
      transaction: t,
    });

    // 3. Snapshot biaya produksi (dikali quantity order)
    let totalCOGS = 0;
    let totalLabor = 0;

    if (templates.length > 0) {
      const costItems = templates.map((tpl: any) => {
        const scaledAmount = Number(tpl.amount) * order.quantity;
        if (['material', 'overhead'].includes(tpl.cost_type)) totalCOGS += scaledAmount;
        if (tpl.cost_type === 'labor') totalLabor += scaledAmount;
        return {
          order_id: orderId,
          name: tpl.name,
          cost_type: tpl.cost_type,
          amount: scaledAmount,
          is_paid: false,
        };
      });
      await OrderCostItem.bulkCreate(costItems, { transaction: t });
    }

    const revenue = Number(order.total_price);

    // 4. Kredit Modal Usaha sejumlah total pembayaran
    await creditFund(
      'capital',
      revenue,
      'order',
      orderId,
      `Pendapatan order ${order.order_code}`,
      t
    );

    // 5. Debit Modal Usaha untuk COGS (material + overhead)
    if (totalCOGS > 0) {
      await debitFund(
        'capital',
        totalCOGS,
        'cost_item',
        orderId,
        `Biaya bahan baku & overhead order ${order.order_code}`,
        t
      );
    }

    // 5b. Auto-deduct Inventory untuk Material
    if (templates.length > 0) {
      for (const tpl of templates) {
        if (tpl.cost_type === 'material') {
           // name format: "Material Name xQuantity"
           const match = tpl.name.match(/(.+) x(\d+)$/);
           if (match) {
             const matName = match[1].trim();
             const itemQty = parseInt(match[2], 10);
             const totalDeductQty = itemQty * order.quantity;
             
             const material = await db.Material.findOne({ where: { name: matName }, transaction: t });
             if (material) {
               await material.update({ stock: material.stock - totalDeductQty }, { transaction: t });
               
               // Low Stock Alert
               if (material.stock - totalDeductQty <= material.min_stock) {
                 logger.warn(`LOW STOCK ALERT: Material "${material.name}" stock is at ${material.stock - totalDeductQty}, which is below or equal to min_stock (${material.min_stock})!`);
               }
             }
           }
        }
      }
    }

    // 6. Kredit Dana Fee Pekerja (hutang upah, belum dibayar)
    if (totalLabor > 0) {
      await creditFund(
        'worker_fee',
        totalLabor,
        'order',
        orderId,
        `Upah pekerja order ${order.order_code} (belum dibayar)`,
        t
      );
    }

    await t.commit();
    logger.info('Pembayaran order dikonfirmasi & kas diperbarui', { orderId, revenue, totalCOGS, totalLabor });
    return await getOrderById(orderId);
  } catch (err) {
    await t.rollback();
    logger.error('Konfirmasi pembayaran gagal, transaksi di-rollback', { orderId, error: err });
    throw err;
  }
};

// ─── Update Status Order (produksi, selesai) ─────────────────────

export const updateOrderStatus = async (orderId: number, status: 'in_production' | 'completed' | 'cancelled') => {
  const order = await Order.findByPk(orderId);
  if (!order) throw new Error('Order tidak ditemukan');
  if (order.status === 'cancelled') throw new Error('Order sudah dibatalkan');
  if (status === 'cancelled' && order.payment_status === 'paid') {
    throw new Error('Order yang sudah dibayar tidak bisa dibatalkan langsung. Hubungi admin.');
  }
  await order.update({ status });
  logger.info('Status order diperbarui', { orderId, status });
  return order;
};

// ─── Bayar Fee Pekerja untuk Order ──────────────────────────────

export const payWorkerFees = async (orderId: number) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, { transaction: t });
    if (!order) throw new Error('Order tidak ditemukan');

    // Ambil semua labor cost items yang belum dibayar
    const unpaidLabor = await OrderCostItem.findAll({
      where: { order_id: orderId, cost_type: 'labor', is_paid: false },
      transaction: t,
    });

    if (unpaidLabor.length === 0) throw new Error('Tidak ada fee pekerja yang belum dibayar');

    const totalToPay = unpaidLabor.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    // Tandai semua sebagai lunas
    await OrderCostItem.update(
      { is_paid: true },
      { where: { order_id: orderId, cost_type: 'labor', is_paid: false }, transaction: t }
    );

    // Debit Dana Fee Pekerja
    await debitFund(
      'worker_fee',
      totalToPay,
      'cost_item',
      orderId,
      `Pembayaran upah pekerja order ${order.order_code}`,
      t
    );

    await t.commit();
    logger.info('Fee pekerja berhasil dibayar', { orderId, totalToPay });
    return { orderId, totalPaid: totalToPay };
  } catch (err) {
    await t.rollback();
    logger.error('Pembayaran fee pekerja gagal', { orderId, error: err });
    throw err;
  }
};
