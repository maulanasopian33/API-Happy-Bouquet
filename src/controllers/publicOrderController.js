const db = require('../models');
const logger = require('../utils/logger');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const { z } = require('zod');

const PublicOrder = db.PublicOrder;

// Buat nomor pesanan format HB-DDMMYY-XXXX
const generateOrderNumber = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const rand = String(Math.floor(1000 + Math.random() * 9000)); // 4 digit
  return `HB-${dd}${mm}${yy}-${rand}`;
};

const createPublicOrderSchema = z.object({
  customer_name: z.string().min(2, 'Nama minimal 2 karakter').max(255),
  customer_phone: z.string().min(8, 'Nomor telepon tidak valid').max(30),
  delivery_address: z.string().max(500).optional(),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD').optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      name: z.string().min(1).max(255),
      qty: z.number().int().min(1),
      price: z.number().min(0),
    })
  ).min(1, 'Minimal 1 item'),
  payment_type: z.enum(['dp', 'full']).default('dp'),
  // Asal channel order: web storefront default 'Web'; enum mencegah nilai liar masuk DB
  channel: z.enum(['Web', 'WhatsApp', 'Shopee', 'TikTok']).default('Web'),
});

// POST /api/orders/public — buat pesanan dari web storefront (tanpa auth)
const createPublicOrder = async (req, res) => {
  try {
    const data = createPublicOrderSchema.parse(req.body);
    const order_number = generateOrderNumber();
    const total_price = data.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    const order = await PublicOrder.create({
      order_number,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      delivery_address: data.delivery_address || null,
      delivery_date: data.delivery_date || null,
      notes: data.notes || null,
      items: data.items,
      total_price,
      payment_type: data.payment_type,
      channel: data.channel,
      status: 'pending_payment',
    });

    logger.info('Pesanan publik masuk dari web', { order_number, total_price });

    return successResponse(res, 'Pesanan berhasil diterima', { order_number }, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Data pesanan tidak valid', 422);
    logger.error('Gagal membuat pesanan publik', { error: err.message });
    return errorResponse(res, 'Gagal menyimpan pesanan, silakan coba lagi');
  }
};

// GET /api/orders/track/:orderNumber — cek status pesanan (tanpa auth, data publik saja)
const getPublicOrderTracking = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    // Validasi format dasar untuk mencegah query DB sembarangan
    if (!/^HB-\d{6}-\d{4}$/.test(orderNumber)) {
      return res.status(404).json({ status: false, message: 'Pesanan tidak ditemukan' });
    }

    const order = await PublicOrder.findOne({ where: { order_number: orderNumber } });
    if (!order) return res.status(404).json({ status: false, message: 'Pesanan tidak ditemukan' });

    // Masking nama: tampilkan 3 karakter pertama + ***
    const maskedName = order.customer_name.slice(0, 3) + '***';

    // Items: hanya nama & qty (tidak expose harga)
    // SQLite menyimpan JSON sebagai string — parse jika perlu
    const rawItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const publicItems = rawItems.map((i) => ({ name: i.name, qty: i.qty }));

    // Tahap status tracking
    const statusSteps = ['pending_payment', 'confirmed', 'in_production', 'completed'];
    const currentIndex = statusSteps.indexOf(order.status);

    return successResponse(res, 'Data pesanan ditemukan', {
      order_number: order.order_number,
      customer_name: maskedName,
      status: order.status,
      channel: order.channel,
      delivery_date: order.delivery_date,
      created_at: order.createdAt,
      items: publicItems,
      // shortcut: step label statis, ganti dengan tabel TrackingSteps jika dibutuhkan audit trail
      tracking_steps: statusSteps.map((s, i) => ({
        status: s,
        label: {
          pending_payment: 'Menunggu Pembayaran',
          confirmed: 'Pesanan Dikonfirmasi',
          in_production: 'Sedang Dibuat',
          completed: 'Siap / Terkirim',
        }[s],
        done: i <= currentIndex && order.status !== 'cancelled',
      })),
    });
  } catch (err) {
    logger.error('Gagal mengambil tracking pesanan publik', { error: err.message });
    return errorResponse(res, 'Gagal mengambil data pesanan');
  }
};

module.exports = { createPublicOrder, getPublicOrderTracking };
