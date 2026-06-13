import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as resellerAdminService from '../services/resellerAdminService';
import {
  changeTierSchema,
  rejectResellerSchema,
  setTierPricesSchema,
} from '../validators/resellerValidator';
import { AuthRequest } from '../middlewares/authMiddleware';

export const listResellers = async (req: Request, res: Response) => {
  try {
    const { status, tier } = req.query;
    const resellers = await resellerAdminService.getAllResellers({ status, tier });
    return successResponse(res, 'Daftar reseller berhasil diambil', resellers);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getReseller = async (req: Request, res: Response) => {
  try {
    const reseller = await resellerAdminService.getResellerDetail(Number(req.params.id));
    return successResponse(res, 'Detail reseller berhasil diambil', reseller);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const approve = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new Error('Admin ID tidak terdeteksi');
    }
    const reseller = await resellerAdminService.approveReseller(Number(req.params.id), adminId);
    return successResponse(res, 'Akun reseller berhasil disetujui', reseller);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const reject = async (req: Request, res: Response) => {
  try {
    const { rejection_reason } = rejectResellerSchema.parse(req.body);
    const reseller = await resellerAdminService.rejectReseller(
      Number(req.params.id),
      rejection_reason
    );
    return successResponse(res, 'Pendaftaran reseller ditolak', reseller);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Alasan penolakan tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message);
  }
};

export const suspend = async (req: Request, res: Response) => {
  try {
    const reseller = await resellerAdminService.suspendReseller(Number(req.params.id));
    return successResponse(res, 'Akun reseller berhasil ditangguhkan', reseller);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const changeTier = async (req: Request, res: Response) => {
  try {
    const { tier } = changeTierSchema.parse(req.body);
    const reseller = await resellerAdminService.changeResellerTier(Number(req.params.id), tier);
    return successResponse(res, 'Tingkatan/tier reseller berhasil diubah', reseller);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Tingkatan/tier tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message);
  }
};

export const setTierPrices = async (req: Request, res: Response) => {
  try {
    const data = setTierPricesSchema.parse(req.body);
    await resellerAdminService.setProductTierPrices(data.product_id, data.prices);
    return successResponse(res, 'Harga tier reseller berhasil ditetapkan');
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Struktur harga tier tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message);
  }
};

export const getTierPrices = async (req: Request, res: Response) => {
  try {
    const prices = await resellerAdminService.getProductTierPrices(Number(req.params.productId));
    return successResponse(res, 'Harga tier reseller berhasil diambil', prices);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const toggleResellable = async (req: Request, res: Response) => {
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
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
