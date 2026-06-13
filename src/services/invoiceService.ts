import db from '../models';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { formatIDR } from '../utils/whatsapp';

const Invoice = db.Invoice;
const Order = db.Order;
const Product = db.Product;
const User = db.User;

export const createInvoice = async (orderId: number) => {
  // Check if invoice already exists
  const existingInvoice = await Invoice.findOne({ where: { order_id: orderId } });
  if (existingInvoice) {
    return existingInvoice;
  }

  // Fetch order with product and customer details
  const order = (await Order.findByPk(orderId, {
    include: [
      { model: Product, as: 'product' },
      { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
    ],
  })) as any;

  if (!order) {
    throw new Error('Order tidak ditemukan');
  }

  // Generate invoice number INV-YYYY-MM-xxxx
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}-${month}-`;

  const count = await Invoice.count({
    where: {
      invoice_number: {
        [Op.like]: `${prefix}%`,
      },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  const invoiceNumber = `${prefix}${seq}`;

  // Ensure upload directory exists
  const invoicesDir = path.join(__dirname, '../../public/uploads/invoices');
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const filename = `${invoiceNumber.replace(/-/g, '_')}.pdf`;
  const relativePath = `/uploads/invoices/${filename}`;
  const absolutePath = path.join(invoicesDir, filename);

  // Generate PDF document
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(absolutePath);

    doc.pipe(writeStream);

    // Header Title
    doc.fontSize(20).text('HAPPY BOUQUET INVOICE', { align: 'center' });
    doc.moveDown();

    // Divider Line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Invoice Info Block
    doc.fontSize(10);
    doc.text(`Invoice No  : ${invoiceNumber}`);
    doc.text(`Tanggal     : ${date.toLocaleDateString('id-ID')}`);
    doc.text(`Status      : LUNAS`);
    doc.moveDown();

    // Bill To Block
    doc.fontSize(12).text('INFORMASI PELANGGAN', { underline: true });
    doc.fontSize(10);
    if (order.order_type === 'reseller') {
      doc.text(`Nama Penerima : ${order.client_name}`);
      doc.text(`Nomor Telepon : ${order.client_phone}`);
      if (order.client_address) {
        doc.text(`Alamat        : ${order.client_address}`);
      }
      doc.text(`Order Melalui : Reseller (${order.customer?.name || 'Mitra'})`);
    } else {
      doc.text(`Nama          : ${order.customer?.name || 'Direct Customer'}`);
      doc.text(`Email         : ${order.customer?.email || '-'}`);
      doc.text(`Telepon       : ${order.customer?.phone || '-'}`);
    }
    doc.moveDown();

    // Detail Order Table
    doc.fontSize(12).text('RINCIAN PEMBELIAN', { underline: true });
    doc.moveDown(0.5);

    // Table Header
    doc.fontSize(10);
    const tableTop = doc.y;
    doc.text('Nama Item', 50, tableTop);
    doc.text('Qty', 350, tableTop, { width: 40, align: 'right' });
    doc.text('Harga Satuan', 400, tableTop, { width: 70, align: 'right' });
    doc.text('Subtotal', 480, tableTop, { width: 70, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Item details
    const itemTop = doc.y;
    const pricePerUnit = order.order_type === 'reseller' && order.reseller_price 
      ? Number(order.reseller_price) 
      : Number(order.product?.price || 0);

    doc.text(order.product?.name || 'Produk Karangan Bunga', 50, itemTop);
    doc.text(String(order.quantity), 350, itemTop, { width: 40, align: 'right' });
    doc.text(`Rp ${formatIDR(pricePerUnit)}`, 400, itemTop, { width: 70, align: 'right' });
    doc.text(`Rp ${formatIDR(order.total_price)}`, 480, itemTop, { width: 70, align: 'right' });

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Total
    const totalTop = doc.y;
    doc.fontSize(12).text('TOTAL BAYAR', 300, totalTop);
    doc.text(`Rp ${formatIDR(order.total_price)}`, 480, totalTop, { width: 70, align: 'right' });

    // Footer
    doc.moveDown(3);
    doc.fontSize(10).text('Terima kasih atas kepercayaan Anda berbelanja di Happy Bouquet!', { align: 'center' });

    doc.end();

    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err) => reject(err));
  });

  // Save entry in DB
  const invoice = await Invoice.create({
    invoice_number: invoiceNumber,
    order_id: orderId,
    total_amount: order.total_price,
    pdf_file_path: relativePath,
    issued_at: new Date(),
  });

  logger.info('Invoice generated successfully', { invoiceId: invoice.id, invoiceNumber });
  return invoice;
};

export const getInvoiceById = async (id: number) => {
  return await Invoice.findByPk(id);
};

export const getInvoiceByOrderId = async (orderId: number) => {
  return await Invoice.findOne({ where: { order_id: orderId } });
};
