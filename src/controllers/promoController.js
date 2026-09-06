const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const promoService = require('../services/promoService');
const { z } = require('zod');

const promoSchema = z.object({
  id: z.string().min(1, 'ID promo wajib diisi'),
  name: z.string().min(1, 'Nama promo wajib diisi'),
  code: z.string().min(1, 'Kode promo wajib diisi'),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.number().positive('Nilai harus lebih dari 0'),
  minOrderAmount: z.number().nonnegative().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(['active', 'inactive']).optional(),
});

const getAllPromos = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const promos = await promoService.getAllPromos(activeOnly);
    return successResponse(res, 'Daftar promo berhasil diambil', promos);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getPromoById = async (req, res) => {
  try {
    const promo = await promoService.getPromoById(String(req.params.id));
    return successResponse(res, 'Promo berhasil diambil', promo);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createPromo = async (req, res) => {
  try {
    const data = promoSchema.parse(req.body);
    const promo = await promoService.createPromo(data);
    return successResponse(res, 'Promo berhasil dibuat', promo, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const updatePromo = async (req, res) => {
  try {
    const data = promoSchema.partial().parse(req.body);
    const promo = await promoService.updatePromo(String(req.params.id), data);
    return successResponse(res, 'Promo berhasil diperbarui', promo);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message, null, 404);
  }
};

const deletePromo = async (req, res) => {
  try {
    await promoService.deletePromo(String(req.params.id));
    return successResponse(res, 'Promo berhasil dihapus');
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

module.exports = {
  getAllPromos,
  getPromoById,
  createPromo,
  updatePromo,
  deletePromo,
};
