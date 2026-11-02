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
