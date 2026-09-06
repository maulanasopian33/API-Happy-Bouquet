const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const resellerAdminService = require('../services/resellerAdminService');
const {
  changeTierSchema,
  rejectResellerSchema,
  setTierPricesSchema,
} = require('../validators/resellerValidator');

const listResellers = async (req, res) => {
  try {
    const { status, tier } = req.query;
    const resellers = await resellerAdminService.getAllResellers({ status, tier });
    return successResponse(res, 'Daftar reseller berhasil diambil', resellers);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getReseller = async (req, res) => {
  try {
    const reseller = await resellerAdminService.getResellerDetail(Number(req.params.id));
    return successResponse(res, 'Detail reseller berhasil diambil', reseller);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const approve = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new Error('Admin ID tidak terdeteksi');
    }
    const reseller = await resellerAdminService.approveReseller(Number(req.params.id), adminId);
    return successResponse(res, 'Akun reseller berhasil disetujui', reseller);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const reject = async (req, res) => {
  try {
    const { rejection_reason } = rejectResellerSchema.parse(req.body);
    const reseller = await resellerAdminService.rejectReseller(
      Number(req.params.id),
      rejection_reason
    );
    return successResponse(res, 'Pendaftaran reseller ditolak', reseller);
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Alasan penolakan tidak valid', 422);
    }
    return errorResponse(res, err.message);
  }
};

const suspend = async (req, res) => {
  try {
    const reseller = await resellerAdminService.suspendReseller(Number(req.params.id));
    return successResponse(res, 'Akun reseller berhasil ditangguhkan', reseller);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const changeTier = async (req, res) => {
  try {
    const { tier } = changeTierSchema.parse(req.body);
    const reseller = await resellerAdminService.changeResellerTier(Number(req.params.id), tier);
    return successResponse(res, 'Tingkatan/tier reseller berhasil diubah', reseller);
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Tingkatan/tier tidak valid', 422);
    }
    return errorResponse(res, err.message);
  }
};

const setTierPrices = async (req, res) => {
  try {
    const data = setTierPricesSchema.parse(req.body);
    await resellerAdminService.setProductTierPrices(data.product_id, data.prices);
    return successResponse(res, 'Harga tier reseller berhasil ditetapkan');
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Struktur harga tier tidak valid', 422);
    }
    return errorResponse(res, err.message);
  }
};

const getTierPrices = async (req, res) => {
  try {
    const prices = await resellerAdminService.getProductTierPrices(Number(req.params.productId));
    return successResponse(res, 'Harga tier reseller berhasil diambil', prices);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const toggleResellable = async (req, res) => {
  try {
    const { is_resellable } = req.body;
    if (typeof is_resellable !== 'boolean') {
      throw new Error('is_resellable harus berupa boolean');
    }
    const visibility = await resellerAdminService.toggleProductResellable(
      Number(req.params.id),
      is_resellable
    );
    return successResponse(res, 'Status produk untuk katalog reseller berhasil diperbarui', visibility);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  listResellers,
  getReseller,
  approve,
  reject,
  suspend,
  changeTier,
  setTierPrices,
  getTierPrices,
  toggleResellable,
};
