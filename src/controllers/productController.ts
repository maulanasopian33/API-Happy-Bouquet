import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as productService from '../services/productService';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().optional(),
  price: z.number().positive('Harga harus lebih dari 0'),
  is_active: z.boolean().optional(),
  category_id: z.number().optional(),
});

const costTemplateSchema = z.object({
  name: z.string().min(1, 'Nama biaya wajib diisi'),
  cost_type: z.enum(['material', 'labor', 'overhead']),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
});

const bulkCostTemplateSchema = z.array(costTemplateSchema).min(1, 'Minimal 1 template biaya');

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === 'true';
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
    const products = await productService.getAllProducts({ activeOnly, categoryId });
    return successResponse(res, 'Daftar produk berhasil diambil', products);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductById(Number(req.params.id));
    return successResponse(res, 'Produk berhasil diambil', product);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);
    const photo_url = (req as any).file ? `/public/uploads/${(req as any).file.filename}` : undefined;
    const product = await productService.createProduct({ ...data, photo_url });
    return successResponse(res, 'Produk berhasil dibuat', product, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message);
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const photo_url = (req as any).file ? `/public/uploads/${(req as any).file.filename}` : undefined;
    const product = await productService.updateProduct(Number(req.params.id), { ...req.body, ...(photo_url && { photo_url }) });
    return successResponse(res, 'Produk berhasil diperbarui', product);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await productService.deleteProduct(Number(req.params.id));
    return successResponse(res, 'Produk berhasil dihapus');
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const getCostTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await productService.getCostTemplates(Number(req.params.id));
    return successResponse(res, 'Template biaya berhasil diambil', templates);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const bulkAddCostTemplates = async (req: Request, res: Response) => {
  try {
    const templates = bulkCostTemplateSchema.parse(req.body);
    const created = await productService.bulkAddCostTemplates(Number(req.params.id), templates);
    return successResponse(res, `${created.length} template biaya berhasil ditambahkan`, created, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message, null, 404);
  }
};

export const deleteCostTemplate = async (req: Request, res: Response) => {
  try {
    await productService.deleteCostTemplate(Number(req.params.templateId));
    return successResponse(res, 'Template biaya berhasil dihapus');
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};
