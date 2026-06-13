import { Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as resellerEarningService from '../services/resellerEarningService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const listEarnings = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await resellerEarningService.getEarnings(resellerId, page, limit);
    return successResponse(res, 'Riwayat komisi/pendapatan berhasil diambil', result);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const summary = await resellerEarningService.getEarningsSummary(resellerId);
    return successResponse(res, 'Ringkasan komisi/pendapatan berhasil diambil', summary);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
