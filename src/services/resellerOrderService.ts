import db from '../models';
import logger from '../utils/logger';

const Order = db.Order;
const Product = db.Product;
const Reseller = db.Reseller;
const ResellerTierPrice = db.ResellerTierPrice;
const ResellerClient = db.ResellerClient;
const ResellerEarning = db.ResellerEarning;
const ProductCostTemplate = db.ProductCostTemplate;

// Helper: Generate unique order code
const generateOrderCode = async (): Promise<string> => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Order.count();
  const seq = String(count + 1).padStart(3, '0');
  return `ORD-${dateStr}-${seq}`;
};

export const getResellerOrders = async (resellerId: number, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Order.findAndCountAll({
    where: { reseller_id: resellerId },
    include: [{ model: Product, as: 'product' }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    orders: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};

export const getResellerOrderById = async (orderId: number, resellerId: number) => {
  const order = await Order.findOne({
    where: { id: orderId, reseller_id: resellerId },
    include: [
      { model: Product, as: 'product' },
      { model: ResellerClient, as: 'client' },
    ],
  });
  if (!order) {
    throw new Error('Order not found');
  }
  return order;
};

export const createResellerOrder = async (resellerUserId: number, data: any) => {
  const transaction = await db.sequelize.transaction();
  try {
    // 1. Get reseller info
    const reseller = await Reseller.findOne({
      where: { user_id: resellerUserId },
      transaction,
    });
    if (!reseller) {
      throw new Error('Reseller profile not found');
    }
    if (reseller.status !== 'active') {
      throw new Error('Akun reseller Anda tidak aktif atau sedang ditangguhkan');
    }

    // 2. Validate product
    const product = await Product.findByPk(data.product_id, { transaction });
    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }
    if (!product.is_active) {
      throw new Error('Produk tidak aktif');
    }

    // 3. Validate client (if client_id is provided)
    if (data.client_id) {
      const client = await ResellerClient.findOne({
        where: { id: data.client_id, reseller_id: reseller.id },
        transaction,
      });
      if (!client) {
        throw new Error('Client tidak ditemukan di repositori Anda');
      }
    }

    // 4. Validate material stock (just like core orderService)
    const templates = await ProductCostTemplate.findAll({
      where: { product_id: data.product_id },
      transaction,
    });

    for (const tpl of templates) {
      if (tpl.cost_type === 'material') {
        const match = tpl.name.match(/(.+) x(\d+)$/);
        if (match) {
          const matName = match[1].trim();
          const itemQty = parseInt(match[2], 10);
          const totalNeeded = itemQty * data.quantity;

          const material = await db.Material.findOne({
            where: { name: matName },
            transaction,
          });
          if (material && material.stock < totalNeeded) {
            throw new Error(
              `Stok bahan baku tidak mencukupi: ${matName} (Butuh: ${totalNeeded}, Ada: ${material.stock})`
            );
          }
        }
      }
    }

    // 5. Calculate pricing
    // Find tier price
    const tierPriceRecord = await ResellerTierPrice.findOne({
      where: { product_id: data.product_id, tier: reseller.tier, is_active: true },
      transaction,
    });

    const reseller_price = tierPriceRecord
      ? Number(tierPriceRecord.reseller_price)
      : Number(product.price); // Fallback to public price if tier price is not set

    const total_price = reseller_price * data.quantity;
    const order_code = await generateOrderCode();

    // 6. Create Order
    const order = await Order.create(
      {
        order_code,
        customer_id: reseller.user_id, // The user placing the order is the reseller's User ID
        product_id: data.product_id,
        quantity: data.quantity,
        total_price,
        status: 'pending',
        payment_status: 'unpaid',
        notes: data.notes || '',
        order_type: 'reseller',
        reseller_id: reseller.id,
        reseller_price,
        client_id: data.client_id || null,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_address: data.client_address || null,
        reseller_notes: data.reseller_notes || null,
        payment_proof_url: null,
      },
      { transaction }
    );

    // 7. Create Pending Earning log
    const publicPrice = Number(product.price);
    const marginPerUnit = publicPrice - reseller_price;
    const totalMargin = marginPerUnit * data.quantity;

    await ResellerEarning.create(
      {
        reseller_id: reseller.id,
        order_id: order.id,
        product_id: product.id,
        quantity: data.quantity,
        reseller_price,
        public_price: publicPrice,
        margin_per_unit: marginPerUnit,
        total_margin: totalMargin,
        status: 'pending',
        earned_at: null,
      },
      { transaction }
    );

    await transaction.commit();
    logger.info('Reseller order created successfully', { orderId: order.id, order_code });
    return order;
  } catch (error) {
    await transaction.rollback();
    logger.error('Reseller order creation failed', { error });
    throw error;
  }
};

export const uploadPaymentProof = async (orderId: number, resellerId: number, fileUrl: string) => {
  const order = await Order.findOne({
    where: { id: orderId, reseller_id: resellerId },
  });
  if (!order) {
    throw new Error('Order tidak ditemukan');
  }

  await order.update({
    payment_proof_url: fileUrl,
  });

  logger.info('Reseller payment proof uploaded', { orderId, fileUrl });
  return order;
};
