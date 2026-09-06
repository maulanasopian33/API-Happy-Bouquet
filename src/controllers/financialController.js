const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const fundService = require('../services/fundService');
const { createManualTransactionSchema, updateManualTransactionSchema } = require('../validators/fundValidator');

const getAllFundAccounts = async (req, res) => {
  try {
    const funds = await fundService.getAllFundAccounts();
    return successResponse(res, 'Daftar kas berhasil diambil', funds);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getFundsSummary = async (req, res) => {
  try {
    const summary = await fundService.getFundsSummary();
    return successResponse(res, 'Ringkasan saldo kas berhasil diambil', summary);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getFundTransactions = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await fundService.getFundTransactions(Number(req.params.id), page, limit);
    return successResponse(res, 'Riwayat transaksi kas berhasil diambil', data);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createManualTransaction = async (req, res) => {
  try {
    const data = createManualTransactionSchema.parse(req.body);
    const transaction = await fundService.createManualTransaction(data);
    return successResponse(res, 'Transaksi manual berhasil dibuat', transaction, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const updateManualTransaction = async (req, res) => {
  try {
    const data = updateManualTransactionSchema.parse(req.body);
    const transaction = await fundService.updateManualTransaction(Number(req.params.id), data);
    return successResponse(res, 'Transaksi manual berhasil diperbarui', transaction);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const deleteManualTransaction = async (req, res) => {
  try {
    await fundService.deleteManualTransaction(Number(req.params.id));
    return successResponse(res, 'Transaksi manual berhasil dihapus dan saldo dipulihkan');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getAllFundAccounts,
  getFundsSummary,
  getFundTransactions,
  createManualTransaction,
  updateManualTransaction,
  deleteManualTransaction,
};
