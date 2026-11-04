const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const settingService = require('../services/settingService');
const { z } = require('zod');

// Zod strip-mode: key di luar skema dibuang otomatis (allowlist ganda di service)
const settingsSchema = z.object({
  brand_name: z.string().max(500).optional(),
  whatsapp_number: z.string().max(500).optional(),
  email: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
  hours: z.string().max(500).optional(),
  instagram_url: z.string().max(500).optional(),
  tiktok_url: z.string().max(500).optional(),
  shopee_url: z.string().max(500).optional(),
  tiktok_shop_url: z.string().max(500).optional(),
  // SEO & Webmaster Settings (CR-0006)
  seo_meta_title: z.string().max(500).optional(),
  seo_meta_description: z.string().max(1000).optional(),
  seo_meta_keywords: z.string().max(1000).optional(),
  seo_canonical_url: z.string().max(500).optional(),
  seo_og_image: z.string().max(1000).optional(),
  seo_google_verification: z.string().max(255).optional(),
  seo_bing_verification: z.string().max(255).optional(),
  seo_robots_directive: z.string().max(100).optional(),
  seo_llms_summary: z.string().max(5000).optional(),
});

const getSettings = async (_req, res) => {
  try {
    const settings = await settingService.getAllSettings();
    return successResponse(res, 'Pengaturan toko berhasil diambil', settings);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const updateSettings = async (req, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const settings = await settingService.upsertSettings(data);
    return successResponse(res, 'Pengaturan toko berhasil diperbarui', settings);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
