import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as heroBannerService from '../services/heroBannerService';
import { z } from 'zod';

const bannerSchema = z.object({
  imageUrl: z.string().url('URL gambar tidak valid'),
  title: z.string().optional(),
  link: z.string().optional(),
  order: z.number().int().optional(),
});

export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const banners = await heroBannerService.getAllBanners();
    return successResponse(res, 'Daftar banner berhasil diambil', banners);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getBannerById = async (req: Request, res: Response) => {
  try {
    const banner = await heroBannerService.getBannerById(Number(req.params.id));
    return successResponse(res, 'Banner berhasil diambil', banner);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createBanner = async (req: Request, res: Response) => {
  try {
    const data = bannerSchema.parse(req.body);
    const banner = await heroBannerService.createBanner(data);
    return successResponse(res, 'Banner berhasil dibuat', banner, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message);
  }
};

export const updateBanner = async (req: Request, res: Response) => {
  try {
    const data = bannerSchema.partial().parse(req.body);
    const banner = await heroBannerService.updateBanner(Number(req.params.id), data);
    return successResponse(res, 'Banner berhasil diperbarui', banner);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message, null, 404);
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  try {
    await heroBannerService.deleteBanner(Number(req.params.id));
    return successResponse(res, 'Banner berhasil dihapus');
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};
