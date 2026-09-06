const { successResponse, errorResponse } = require('../utils/response');
const resellerEarningService = require('../services/resellerEarningService');

const listEarnings = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await resellerEarningService.getEarnings(resellerId, page, limit);
    return successResponse(res, 'Riwayat komisi/pendapatan berhasil diambil', result);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getSummary = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const summary = await resellerEarningService.getEarningsSummary(resellerId);
    return successResponse(res, 'Ringkasan komisi/pendapatan berhasil diambil', summary);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  listEarnings,
  getSummary,
};
