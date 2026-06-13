import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter'),
  description: z.string().optional(),
  price: z.union([
    z.number().positive('Harga harus lebih dari 0'),
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Format harga tidak valid').transform(Number),
  ]),
  category_id: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d+$/).transform(Number),
  ]).optional(),
  type: z.enum(['ready', 'preorder']).default('ready'),
  preorder_duration: z.union([
    z.number().int().positive(),
    z.string().regex(/^\d+$/).transform(Number),
  ]).optional(),
  is_active: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const costTemplateSchema = z.object({
  templates: z.array(z.object({
    name: z.string().min(1, 'Nama template wajib diisi'),
    cost_type: z.enum(['material', 'labor', 'overhead']),
    amount: z.number().positive('Jumlah harus lebih dari 0'),
  })).min(1, 'Minimal 1 template biaya'),
});
