const db = require('../models');
const logger = require('../utils/logger');

const HeroBanner = db.HeroBanner;

const getAllBanners = async () => {
  return await HeroBanner.findAll({ order: [['order', 'ASC']] });
};

const getBannerById = async (id) => {
  const banner = await HeroBanner.findByPk(id);
  if (!banner) throw new Error('Banner tidak ditemukan');
  return banner;
};

const createBanner = async (data) => {
  const banner = await HeroBanner.create(data);
  logger.info('Banner berhasil dibuat', { bannerId: banner.id });
  return banner;
};

const updateBanner = async (id, data) => {
  const banner = await HeroBanner.findByPk(id);
  if (!banner) throw new Error('Banner tidak ditemukan');
  const updated = await banner.update(data);
  logger.info('Banner diperbarui', { bannerId: id });
  return updated;
};

const deleteBanner = async (id) => {
  const banner = await HeroBanner.findByPk(id);
  if (!banner) throw new Error('Banner tidak ditemukan');
  await banner.destroy();
  logger.info('Banner dihapus', { bannerId: id });
};

module.exports = {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
};
