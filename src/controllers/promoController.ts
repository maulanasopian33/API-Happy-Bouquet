import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as promoService from '../services/promoService';
import { z } from 'zod';

const promoSchema = z.object({
  id: z.string().min(1, 'ID promo wajib diisi'),
  name: z.string().min(1, 'Nama promo wajib diisi'),
  code: z.string().min(1, 'Kode promo wajib diisi'),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.number().positive('Nilai harus lebih dari 0'),
  minOrderAmount: z.number().nonnegative().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const getAllPromos = async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === 'true';
    const promos = await promoService.getAllPromos(activeOnly);
    return successResponse(res, 'Daftar promo berhasil diambil', promos);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getPromoById = async (req: Request, res: Response) => {
  try {
    const promo = await promoService.getPromoById(String(req.params.id));
    return successResponse(res, 'Promo berhasil diambil', promo);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createPromo = async (req: Request, res: Response) => {
  try {
    const data = promoSchema.parse(req.body);
    const promo = await promoService.createPromo(data);
    return successResponse(res, 'Promo berhasil dibuat', promo, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message);
  }
};

export const updatePromo = async (req: Request, res: Response) => {
  try {
    const data = promoSchema.partial().parse(req.body);
    const promo = await promoService.updatePromo(String(req.params.id), data);
    return successResponse(res, 'Promo berhasil diperbarui', promo);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message, null, 404);
  }
};

export const deletePromo = async (req: Request, res: Response) => {
  try {
    await promoService.deletePromo(String(req.params.id));
    return successResponse(res, 'Promo berhasil dihapus');
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};
