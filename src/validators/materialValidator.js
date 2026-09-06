const { z } = require('zod');

// ─── Material (Inventori) ────────────────────────────────────────
const materialSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  unit: z.string().min(1, 'Unit wajib diisi'),
  category: z.string().min(3, 'Kategori minimal 3 karakter'),
  price_per_unit: z.string().regex(/^\d+$/, 'Harga harus berupa angka').transform(Number),
  stock: z.string().regex(/^\d+$/, 'Stok harus berupa angka').transform(Number),
  min_stock: z.string().regex(/^\d+$/, 'Stok minimum harus berupa angka').transform(Number).optional(),
});

module.exports = { materialSchema };
