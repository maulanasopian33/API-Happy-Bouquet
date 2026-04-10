import db from '../models';
import logger from '../utils/logger';

const Promo = db.Promo;

export const getAllPromos = async (activeOnly = false) => {
  const where = activeOnly ? { status: 'active' } : {};
  return await Promo.findAll({ where });
};

export const getPromoById = async (id: string) => {
  const promo = await Promo.findByPk(id);
  if (!promo) throw new Error('Promo tidak ditemukan');
  return promo;
};

export const createPromo = async (data: any) => {
  const promo = await Promo.create(data);
  logger.info('Promo berhasil dibuat', { promoId: promo.id, code: promo.code });
  return promo;
};

export const updatePromo = async (id: string, data: any) => {
  const promo = await Promo.findByPk(id);
  if (!promo) throw new Error('Promo tidak ditemukan');
  const updated = await promo.update(data);
  logger.info('Promo diperbarui', { promoId: id });
  return updated;
};

export const deletePromo = async (id: string) => {
  const promo = await Promo.findByPk(id);
  if (!promo) throw new Error('Promo tidak ditemukan');
  await promo.destroy();
  logger.info('Promo dihapus', { promoId: id });
};
