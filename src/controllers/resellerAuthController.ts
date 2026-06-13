import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as resellerService from '../services/resellerService';
import { registerResellerSchema, updateResellerProfileSchema } from '../validators/resellerValidator';
import { AuthRequest } from '../middlewares/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerResellerSchema.parse(req.body);
    const reseller = await resellerService.registerReseller(data);
    return successResponse(
      res,
      'Pendaftaran reseller berhasil diajukan. Menunggu persetujuan admin.',
      reseller,
      201
    );
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Struktur input data tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message || 'Gagal mendaftar sebagai reseller');
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new Error('User tidak terautentikasi');
    }
    const profile = await resellerService.getResellerProfileByUserId(req.user.id);
    return successResponse(res, 'Profil reseller berhasil diambil', profile);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const data = updateResellerProfileSchema.parse(req.body);
    const updated = await resellerService.updateResellerProfile(resellerId, data);
    return successResponse(res, 'Profil reseller berhasil diperbarui', updated);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Pembaruan data profil tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message);
  }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const stats = await resellerService.getDashboardStats(resellerId);
    return successResponse(res, 'Statistik dashboard reseller berhasil diambil', stats);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

