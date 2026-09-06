const { z } = require('zod');

// ─── Customer ────────────────────────────────────────────────────
// `status` hanya ada di tipe frontend panel (tidak ada kolom di DB);
// diabaikan agar tidak gagal validasi.
const createCustomerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

module.exports = { createCustomerSchema, updateCustomerSchema };
