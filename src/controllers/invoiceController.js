const { successResponse, errorResponse } = require('../utils/response');
const invoiceService = require('../services/invoiceService');
const db = require('../models');
const path = require('path');
const fs = require('fs');

const Order = db.Order;

const getInvoiceByOrderId = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const order = await Order.findByPk(orderId);
    if (!order) {
      return errorResponse(res, 'Order tidak ditemukan', null, 404);
    }

    if (!req.user) {
      return errorResponse(res, 'Autentikasi diperlukan', null, 401);
    }
    const user = req.user;
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
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const order = await Order.findByPk(orderId);
    if (!order) {
      return errorResponse(res, 'Order tidak ditemukan', null, 404);
    }

    if (!req.user) {
      return errorResponse(res, 'Autentikasi diperlukan', null, 401);
    }
    const user = req.user;
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
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getInvoiceByOrderId,
  downloadInvoice,
};
