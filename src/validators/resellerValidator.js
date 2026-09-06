const { z } = require('zod');

// ─── Reseller Registration ──────────────────────────────────────
const registerResellerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').optional(),
  shop_name: z.string().min(3, 'Nama toko minimal 3 karakter'),
  slug: z.string()
    .min(3, 'Slug minimal 3 karakter')
    .max(100, 'Slug maksimal 100 karakter')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  whatsapp_number: z.string()
    .min(10, 'Nomor WhatsApp minimal 10 karakter')
    .regex(/^\d+$/, 'Nomor WhatsApp hanya boleh angka'),
  shop_bio: z.string().max(500, 'Bio toko maksimal 500 karakter').optional(),
});

// ─── Update Reseller Profile ────────────────────────────────────
const updateResellerProfileSchema = z.object({
  shop_name: z.string().min(3, 'Nama toko minimal 3 karakter').optional(),
  slug: z.string()
    .min(3, 'Slug minimal 3 karakter')
    .max(100, 'Slug maksimal 100 karakter')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
    .optional(),
  whatsapp_number: z.string().min(10).regex(/^\d+$/, 'Hanya angka').optional(),
  shop_bio: z.string().max(500).optional(),
});

// ─── Reseller Client ────────────────────────────────────────────
const createClientSchema = z.object({
  name: z.string().min(2, 'Nama client minimal 2 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

// ─── Reseller Order ─────────────────────────────────────────────
const createResellerOrderSchema = z.object({
  product_id: z.number().int().positive('Product ID wajib diisi'),
  quantity: z.number().int().positive('Quantity harus lebih dari 0').default(1),
  client_id: z.number().int().positive().optional(),
  client_name: z.string().min(2, 'Nama client minimal 2 karakter'),
  client_phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  client_address: z.string().optional(),
  reseller_notes: z.string().optional(),
});

// ─── Catalog Settings ───────────────────────────────────────────
const updateCatalogSettingsSchema = z.object({
  banner_url: z.string().url().optional().or(z.literal('')),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna hex tidak valid').optional(),
  show_price: z.boolean().optional(),
  show_stock: z.boolean().optional(),
  custom_cta_text: z.string().max(100).optional(),
  featured_product_ids: z.array(z.number().int().positive()).optional(),
  announcement_text: z.string().max(500).optional().or(z.literal('')),
  is_closed: z.boolean().optional(),
  closed_message: z.string().max(255).optional(),
});

// ─── WhatsApp Template ──────────────────────────────────────────
const updateWhatsappTemplateSchema = z.object({
  template: z.string().min(10, 'Template minimal 10 karakter').max(1000, 'Template maksimal 1000 karakter'),
});

// ─── Admin: Tier Prices ─────────────────────────────────────────
const setTierPricesSchema = z.object({
  product_id: z.number().int().positive('Product ID wajib diisi'),
  prices: z.array(z.object({
    tier: z.enum(['silver', 'gold', 'platinum']),
    reseller_price: z.number().positive('Harga harus lebih dari 0'),
  })).min(1, 'Minimal 1 harga tier'),
});

// ─── Admin: Change Tier ─────────────────────────────────────────
const changeTierSchema = z.object({
  tier: z.enum(['silver', 'gold', 'platinum']),
});

// ─── Admin: Reject Reseller ─────────────────────────────────────
const rejectResellerSchema = z.object({
  rejection_reason: z.string().min(5, 'Alasan penolakan minimal 5 karakter'),
});

module.exports = {
  registerResellerSchema,
  updateResellerProfileSchema,
  createClientSchema,
  updateClientSchema,
  createResellerOrderSchema,
  updateCatalogSettingsSchema,
  updateWhatsappTemplateSchema,
  setTierPricesSchema,
  changeTierSchema,
  rejectResellerSchema,
};
