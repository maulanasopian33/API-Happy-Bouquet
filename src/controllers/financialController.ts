import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as fundService from '../services/fundService';
import { createManualTransactionSchema, updateManualTransactionSchema } from '../validators/fundValidator';

export const getAllFundAccounts = async (req: Request, res: Response) => {
  try {
    const funds = await fundService.getAllFundAccounts();
    return successResponse(res, 'Daftar kas berhasil diambil', funds);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getFundsSummary = async (req: Request, res: Response) => {
  try {
    const summary = await fundService.getFundsSummary();
    return successResponse(res, 'Ringkasan saldo kas berhasil diambil', summary);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getFundTransactions = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await fundService.getFundTransactions(Number(req.params.id), page, limit);
    return successResponse(res, 'Riwayat transaksi kas berhasil diambil', data);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createManualTransaction = async (req: Request, res: Response) => {
  try {
    const data = createManualTransactionSchema.parse(req.body);
    const transaction = await fundService.createManualTransaction(data);
    return successResponse(res, 'Transaksi manual berhasil dibuat', transaction, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message);
  }
};

export const updateManualTransaction = async (req: Request, res: Response) => {
  try {
    const data = updateManualTransactionSchema.parse(req.body);
    const transaction = await fundService.updateManualTransaction(Number(req.params.id), data);
    return successResponse(res, 'Transaksi manual berhasil diperbarui', transaction);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message);
  }
};

export const deleteManualTransaction = async (req: Request, res: Response) => {
  try {
    await fundService.deleteManualTransaction(Number(req.params.id));
    return successResponse(res, 'Transaksi manual berhasil dihapus dan saldo dipulihkan');
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
