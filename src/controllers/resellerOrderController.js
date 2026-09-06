const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const resellerOrderService = require('../services/resellerOrderService');
const { createResellerOrderSchema } = require('../validators/resellerValidator');

const listOrders = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await resellerOrderService.getResellerOrders(resellerId, page, limit);
    return successResponse(res, 'Daftar pesanan berhasil diambil', result);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getOrder = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const order = await resellerOrderService.getResellerOrderById(
      Number(req.params.id),
      resellerId
    );
    return successResponse(res, 'Detail pesanan berhasil diambil', order);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createOrder = async (req, res) => {
  try {
    if (!req.user) {
      throw new Error('User tidak terautentikasi');
    }
    const data = createResellerOrderSchema.parse(req.body);
    const order = await resellerOrderService.createResellerOrder(req.user.id, data);
    return successResponse(res, 'Pesanan reseller berhasil dibuat', order, 201);
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Input pesanan tidak valid', 422);
    }
    return errorResponse(res, err.message);
  }
};

const uploadProof = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    if (!req.file) {
      throw new Error('File bukti transfer pembayaran wajib diunggah');
    }

    const fileUrl = `/uploads/payments/${req.file.filename}`;

    const order = await resellerOrderService.uploadPaymentProof(
      Number(req.params.id),
      resellerId,
      fileUrl
    );
    return successResponse(res, 'Bukti pembayaran berhasil diunggah', order);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  uploadProof,
};
