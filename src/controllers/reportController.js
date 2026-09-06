const { successResponse, errorResponse } = require('../utils/response');
const reportService = require('../services/reportService');

const getGlobalSummary = async (req, res) => {
  try {
    const summary = await reportService.getGlobalSummary();
    return successResponse(res, 'Laporan keuangan global berhasil diambil', summary);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getOrderFinancialReport = async (req, res) => {
  try {
    const report = await reportService.getOrderFinancialReport(Number(req.params.id));
    return successResponse(res, 'Laporan keuangan order berhasil diambil', report);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const getOrdersProfitList = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await reportService.getOrdersProfitList(page, limit);
    return successResponse(res, 'Daftar profit order berhasil diambil', data);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getBalanceSheet = async (req, res) => {
  try {
    const data = await reportService.getBalanceSheet();
    return successResponse(res, 'Laporan neraca berhasil diambil', data);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getGlobalSummary,
  getOrderFinancialReport,
  getOrdersProfitList,
  getBalanceSheet,
};
