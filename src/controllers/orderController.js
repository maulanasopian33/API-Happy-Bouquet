const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const orderService = require('../services/orderService');
const profitService = require('../services/profitService');
const { z } = require('zod');

const createOrderSchema = z.object({
  customer_id: z.number().int().positive('customer_id wajib diisi'),
  product_id: z.number().int().positive('product_id wajib diisi'),
  quantity: z.number().int().min(1, 'Kuantitas minimal 1').default(1),
  notes: z.string().optional(),
});

const allocateProfitSchema = z.object({
  allocations: z.array(
    z.object({
      fund_account_id: z.number().int().positive(),
      amount: z.number().positive('Jumlah alokasi harus lebih dari 0'),
    })
  ).min(1, 'Minimal 1 alokasi'),
});

const getAllOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const customerId = req.query.customer_id ? Number(req.query.customer_id) : undefined;
    const data = await orderService.getAllOrders(page, limit, customerId);
    return successResponse(res, 'Daftar order berhasil diambil', data);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(Number(req.params.id));
    return successResponse(res, 'Order berhasil diambil', order);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createOrder = async (req, res) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const order = await orderService.createOrder(data);
    return successResponse(res, 'Order berhasil dibuat', order, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const confirmPayment = async (req, res) => {
  try {
    const order = await orderService.confirmPayment(Number(req.params.id));
    return successResponse(res, 'Pembayaran berhasil dikonfirmasi. Biaya produksi & kas otomatis diperbarui.', order);
  } catch (err) {
    return errorResponse(res, err.message, null, 400);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const allowedStatus = ['in_production', 'completed', 'cancelled'];
    const statusSchema = z.object({ status: z.enum(allowedStatus) });
    const { status } = statusSchema.parse(req.body);
    const order = await orderService.updateOrderStatus(Number(req.params.id), status);
    return successResponse(res, `Status order diperbarui menjadi "${status}"`, order);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Status tidak valid', 422);
    return errorResponse(res, err.message, null, 400);
  }
};

const payWorkerFees = async (req, res) => {
  try {
    const result = await orderService.payWorkerFees(Number(req.params.id));
    return successResponse(res, 'Fee pekerja berhasil dibayar', result);
  } catch (err) {
    return errorResponse(res, err.message, null, 400);
  }
};

const getOrderProfit = async (req, res) => {
  try {
    const profit = await profitService.calculateOrderProfit(Number(req.params.id));
    return successResponse(res, 'Kalkulasi profit order berhasil dihitung', profit);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const allocateProfit = async (req, res) => {
  try {
    const { allocations } = allocateProfitSchema.parse(req.body);
    const result = await profitService.allocateProfit(Number(req.params.id), allocations);
    return successResponse(res, 'Profit berhasil dialokasikan', result, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message, null, 400);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  confirmPayment,
  updateOrderStatus,
  payWorkerFees,
  getOrderProfit,
  allocateProfit,
};
