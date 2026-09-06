const { z } = require('zod');

const createOrderSchema = z.object({
  customer_id: z.number().int().positive('Customer ID wajib diisi'),
  product_id: z.number().int().positive('Product ID wajib diisi'),
  quantity: z.number().int().positive('Quantity harus lebih dari 0').default(1),
  notes: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['in_production', 'completed', 'cancelled']),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };
