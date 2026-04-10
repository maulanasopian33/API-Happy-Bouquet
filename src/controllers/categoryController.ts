import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as categoryService from '../services/categoryService';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  icon: z.string().optional(),
});

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();
    return successResponse(res, 'Daftar kategori berhasil diambil', categories);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getCategoryById(Number(req.params.id));
    return successResponse(res, 'Kategori berhasil diambil', category);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await categoryService.createCategory(data);
    return successResponse(res, 'Kategori berhasil dibuat', category, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message);
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await categoryService.updateCategory(Number(req.params.id), data);
    return successResponse(res, 'Kategori berhasil diperbarui', category);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message, null, 404);
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    await categoryService.deleteCategory(Number(req.params.id));
    return successResponse(res, 'Kategori berhasil dihapus');
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};
