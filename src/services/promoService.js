const db = require('../models');
const logger = require('../utils/logger');

const Promo = db.Promo;

const getAllPromos = async (activeOnly = false) => {
  const where = activeOnly ? { status: 'active' } : {};
  return await Promo.findAll({ where });
};

const getPromoById = async (id) => {
  const promo = await Promo.findByPk(id);
  if (!promo) throw new Error('Promo tidak ditemukan');
  return promo;
};

const createPromo = async (data) => {
  const promo = await Promo.create(data);
  logger.info('Promo berhasil dibuat', { promoId: promo.id, code: promo.code });
  return promo;
};

const updatePromo = async (id, data) => {
  const promo = await Promo.findByPk(id);
  if (!promo) throw new Error('Promo tidak ditemukan');
  const updated = await promo.update(data);
  logger.info('Promo diperbarui', { promoId: id });
  return updated;
};

const deletePromo = async (id) => {
  const promo = await Promo.findByPk(id);
  if (!promo) throw new Error('Promo tidak ditemukan');
  await promo.destroy();
  logger.info('Promo dihapus', { promoId: id });
};

module.exports = {
  getAllPromos,
  getPromoById,
  createPromo,
  updatePromo,
  deletePromo,
};
