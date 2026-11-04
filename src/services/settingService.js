const db = require('../models');
const logger = require('../utils/logger');

const StoreSetting = db.StoreSetting;

// Allowlist key kontrak storefront (composables/useStoreSettings.ts).
// Key di luar daftar ini tidak pernah tampil di respons publik.
const ALLOWED_KEYS = [
  'brand_name',
  'whatsapp_number',
  'email',
  'address',
  'hours',
  'instagram_url',
  'tiktok_url',
  'shopee_url',
  'tiktok_shop_url',
  // SEO & Webmaster Settings (CR-0006)
  'seo_meta_title',
  'seo_meta_description',
  'seo_meta_keywords',
  'seo_canonical_url',
  'seo_og_image',
  'seo_google_verification',
  'seo_bing_verification',
  'seo_robots_directive',
  'seo_llms_summary',
  // Dynamic Content & CMS Settings (CR-0007)
  'shipping_options',
  'payment_methods_config',
  'store_bank_accounts',
  'home_trust_stats',
  'home_trust_badges',
  'home_testimonials',
  'store_faqs',
  'about_brand_story',
  'about_values',
  'page_shipping_content',
  'page_terms_content',
  'page_privacy_content',
];

const getAllSettings = async () => {
  const rows = await StoreSetting.findAll();
  const settings = {};
  for (const row of rows) {
    if (ALLOWED_KEYS.includes(row.key)) settings[row.key] = row.value ?? '';
  }
  return settings;
};

// Upsert parsial: hanya key yang dikirim yang disimpan, sisanya tidak tersentuh.
const upsertSettings = async (data) => {
  const entries = Object.entries(data).filter(([key]) => ALLOWED_KEYS.includes(key));
  if (entries.length > 0) {
    await StoreSetting.bulkCreate(
      entries.map(([key, value]) => ({ key, value })),
      { updateOnDuplicate: ['value'] }
    );
    logger.info('Pengaturan toko diperbarui', { keys: entries.map(([key]) => key) });
  }
  return getAllSettings();
};

module.exports = {
  ALLOWED_KEYS,
  getAllSettings,
  upsertSettings,
};
