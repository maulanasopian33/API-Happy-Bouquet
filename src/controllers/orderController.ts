import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as orderService from '../services/orderService';
import * as profitService from '../services/profitService';
import { z } from 'zod';

const createOrderSchema = z.object({
  customer_id: z.number().int().positive('customer_id wajib diisi'),
  product_id: z.number().int().positive('product_id wajib diisi'),
  quantity: z.number().int().min(1, 'Kuantitas minimal 1').default(1),
  notes: z.string().optional(),
});

const allocateProfitSchema = z.object({
  allocations: z.array(
    z.object({
      fund_account_id: z.number().int().positive(),
      amount: z.number().positive('Jumlah alokasi harus lebih dari 0'),
    })
  ).min(1, 'Minimal 1 alokasi'),
});

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await orderService.getAllOrders(page, limit);
    return successResponse(res, 'Daftar order berhasil diambil', data);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderById(Number(req.params.id));
    return successResponse(res, 'Order berhasil diambil', order);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const order = await orderService.createOrder(data);
    return successResponse(res, 'Order berhasil dibuat', order, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message);
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const order = await orderService.confirmPayment(Number(req.params.id));
    return successResponse(res, 'Pembayaran berhasil dikonfirmasi. Biaya produksi & kas otomatis diperbarui.', order);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 400);
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const allowedStatus = ['in_production', 'completed', 'cancelled'] as const;
    const statusSchema = z.object({ status: z.enum(allowedStatus) });
    const { status } = statusSchema.parse(req.body);
    const order = await orderService.updateOrderStatus(Number(req.params.id), status);
    return successResponse(res, `Status order diperbarui menjadi "${status}"`, order);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Status tidak valid', err.errors, 422);
    return errorResponse(res, err.message, null, 400);
  }
};

export const payWorkerFees = async (req: Request, res: Response) => {
  try {
    const result = await orderService.payWorkerFees(Number(req.params.id));
    return successResponse(res, 'Fee pekerja berhasil dibayar', result);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 400);
  }
};

export const getOrderProfit = async (req: Request, res: Response) => {
  try {
    const profit = await profitService.calculateOrderProfit(Number(req.params.id));
    return successResponse(res, 'Kalkulasi profit order berhasil dihitung', profit);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const allocateProfit = async (req: Request, res: Response) => {
  try {
    const { allocations } = allocateProfitSchema.parse(req.body);
    const result = await profitService.allocateProfit(Number(req.params.id), allocations);
    return successResponse(res, 'Profit berhasil dialokasikan', result, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message, null, 400);
  }
};
