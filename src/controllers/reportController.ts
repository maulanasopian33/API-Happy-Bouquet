import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as reportService from '../services/reportService';

export const getGlobalSummary = async (req: Request, res: Response) => {
  try {
    const summary = await reportService.getGlobalSummary();
    return successResponse(res, 'Laporan keuangan global berhasil diambil', summary);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getOrderFinancialReport = async (req: Request, res: Response) => {
  try {
    const report = await reportService.getOrderFinancialReport(Number(req.params.id));
    return successResponse(res, 'Laporan keuangan order berhasil diambil', report);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const getOrdersProfitList = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await reportService.getOrdersProfitList(page, limit);
    return successResponse(res, 'Daftar profit order berhasil diambil', data);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const data = await reportService.getBalanceSheet();
    return successResponse(res, 'Laporan neraca berhasil diambil', data);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

