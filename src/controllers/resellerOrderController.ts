import { Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as resellerOrderService from '../services/resellerOrderService';
import { createResellerOrderSchema } from '../validators/resellerValidator';
import { AuthRequest } from '../middlewares/authMiddleware';

export const listOrders = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await resellerOrderService.getResellerOrders(resellerId, page, limit);
    return successResponse(res, 'Daftar pesanan berhasil diambil', result);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const order = await resellerOrderService.getResellerOrderById(
      Number(req.params.id),
      resellerId
    );
    return successResponse(res, 'Detail pesanan berhasil diambil', order);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new Error('User tidak terautentikasi');
    }
    const data = createResellerOrderSchema.parse(req.body);
    const order = await resellerOrderService.createResellerOrder(req.user.id, data);
    return successResponse(res, 'Pesanan reseller berhasil dibuat', order, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Input pesanan tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message);
  }
};

export const uploadProof = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    if (!req.file) {
      throw new Error('File bukti transfer pembayaran wajib diunggah');
    }

    // Path stored in DB relative to project (e.g. public/uploads/payments/filename)
    // Or full URL or custom path. Let's make it consistent.
    const fileUrl = `/uploads/payments/${req.file.filename}`;

    const order = await resellerOrderService.uploadPaymentProof(
      Number(req.params.id),
      resellerId,
      fileUrl
    );
    return successResponse(res, 'Bukti pembayaran berhasil diunggah', order);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
