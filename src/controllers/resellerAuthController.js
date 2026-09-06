const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const resellerService = require('../services/resellerService');
const { registerResellerSchema, updateResellerProfileSchema } = require('../validators/resellerValidator');

const register = async (req, res) => {
  try {
    const data = registerResellerSchema.parse(req.body);
    const reseller = await resellerService.registerReseller(data);
    return successResponse(
      res,
      'Pendaftaran reseller berhasil diajukan. Menunggu persetujuan admin.',
      reseller,
      201
    );
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Struktur input data tidak valid', 422);
    }
    return errorResponse(res, err.message || 'Gagal mendaftar sebagai reseller');
  }
};

const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      throw new Error('User tidak terautentikasi');
    }
    const profile = await resellerService.getResellerProfileByUserId(req.user.id);
    return successResponse(res, 'Profil reseller berhasil diambil', profile);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const data = updateResellerProfileSchema.parse(req.body);
    const updated = await resellerService.updateResellerProfile(resellerId, data);
    return successResponse(res, 'Profil reseller berhasil diperbarui', updated);
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Pembaruan data profil tidak valid', 422);
    }
    return errorResponse(res, err.message);
  }
};

const getDashboard = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const stats = await resellerService.getDashboardStats(resellerId);
    return successResponse(res, 'Statistik dashboard reseller berhasil diambil', stats);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  register,
  getProfile,
  updateProfile,
  getDashboard,
};
