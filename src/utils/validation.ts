import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const materialSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(3, 'Category must be at least 3 characters'),
  price_per_unit: z.string().regex(/^\d+$/, 'Price must be a number').transform(Number),
  stock: z.string().regex(/^\d+$/, 'Stock must be a number').transform(Number),
  min_stock: z.string().regex(/^\d+$/, 'Min stock must be a number').transform(Number).optional(),
});
