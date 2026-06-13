import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as invoiceService from '../services/invoiceService';
import db from '../models';
import path from 'path';
import fs from 'fs';

const Order = db.Order;

export const getInvoiceByOrderId = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    const order = await Order.findByPk(orderId);
    if (!order) {
      return errorResponse(res, 'Order tidak ditemukan', null, 404);
    }

    const user = (req as any).user;
    if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'staff') {
      if (order.customer_id !== user.id) {
        return errorResponse(res, 'Akses ditolak', null, 403);
      }
    }

    const invoice = await invoiceService.getInvoiceByOrderId(orderId);
    if (!invoice) {
      return errorResponse(res, 'Invoice belum dibuat', null, 404);
    }

    return successResponse(res, 'Invoice berhasil diambil', invoice);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    const order = await Order.findByPk(orderId);
    if (!order) {
      return errorResponse(res, 'Order tidak ditemukan', null, 404);
    }

    const user = (req as any).user;
    if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'staff') {
      if (order.customer_id !== user.id) {
        return errorResponse(res, 'Akses ditolak', null, 403);
      }
    }

    const invoice = await invoiceService.getInvoiceByOrderId(orderId);
    if (!invoice) {
      return errorResponse(res, 'Invoice belum dibuat', null, 404);
    }

    const filePath = path.join(__dirname, '../../public', invoice.pdf_file_path);
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'Berkas PDF invoice tidak ditemukan', null, 404);
    }

    return res.download(filePath, `${invoice.invoice_number}.pdf`);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
