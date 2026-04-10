import db from '../models';
import logger from '../utils/logger';

const HeroBanner = db.HeroBanner;

export const getAllBanners = async () => {
  return await HeroBanner.findAll({ order: [['order', 'ASC']] });
};

export const getBannerById = async (id: number) => {
  const banner = await HeroBanner.findByPk(id);
  if (!banner) throw new Error('Banner tidak ditemukan');
  return banner;
};

export const createBanner = async (data: any) => {
  const banner = await HeroBanner.create(data);
  logger.info('Banner berhasil dibuat', { bannerId: banner.id });
  return banner;
};

export const updateBanner = async (id: number, data: any) => {
  const banner = await HeroBanner.findByPk(id);
  if (!banner) throw new Error('Banner tidak ditemukan');
  const updated = await banner.update(data);
  logger.info('Banner diperbarui', { bannerId: id });
  return updated;
};

export const deleteBanner = async (id: number) => {
  const banner = await HeroBanner.findByPk(id);
  if (!banner) throw new Error('Banner tidak ditemukan');
  await banner.destroy();
  logger.info('Banner dihapus', { bannerId: id });
};
