const db = require('../models');
const logger = require('../utils/logger');
const { sendInAppNotification, sendEmailNotification } = require('./notificationService');

const User = db.User;
const Reseller = db.Reseller;
const ResellerTierPrice = db.ResellerTierPrice;
const ResellerProductVisibility = db.ResellerProductVisibility;

const getAllResellers = async (filter = {}) => {
  const where = {};
  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.tier) {
    where.tier = filter.tier;
  }
  return await Reseller.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }],
    order: [['createdAt', 'DESC']],
  });
};

const getResellerDetail = async (id) => {
  const reseller = await Reseller.findByPk(id, {
    include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }],
  });
  if (!reseller) {
    throw new Error('Reseller not found');
  }
  return reseller;
};

const approveReseller = async (id, adminId) => {
  const reseller = await Reseller.findByPk(id);
  if (!reseller) {
    throw new Error('Reseller not found');
  }

  await reseller.update({
    status: 'active',
    approved_at: new Date(),
    approved_by: adminId,
    rejection_reason: null,
  });

  try {
    const user = await User.findByPk(reseller.user_id);
    if (user) {
      await sendInAppNotification(reseller.user_id, 'reseller_approved', {});
      if (user.email) {
        const catalogUrl = `${process.env.APP_URL || 'http://localhost:3000'}/r/${reseller.slug}`;
        await sendEmailNotification(
          user.email,
          'reseller_welcome',
          {
            reseller_name: user.name,
            catalog_url: catalogUrl,
          },
          reseller.user_id
        );
      }
    }
  } catch (notifErr) {
    logger.error('Gagal mengirim notifikasi approval reseller', { resellerId: id, error: notifErr });
  }

  logger.info('Reseller approved', { resellerId: id, adminId });
  return reseller;
};

const rejectReseller = async (id, reason) => {
  const reseller = await Reseller.findByPk(id);
  if (!reseller) {
    throw new Error('Reseller not found');
  }

  await reseller.update({
    status: 'rejected',
    rejection_reason: reason,
    approved_at: null,
    approved_by: null,
  });

  try {
    await sendInAppNotification(reseller.user_id, 'reseller_rejected', { reason });
  } catch (notifErr) {
    logger.error('Gagal mengirim notifikasi rejection reseller', { resellerId: id, error: notifErr });
  }

  logger.info('Reseller rejected', { resellerId: id, reason });
  return reseller;
};

const suspendReseller = async (id) => {
  const reseller = await Reseller.findByPk(id);
  if (!reseller) {
    throw new Error('Reseller not found');
  }

  await reseller.update({
    status: 'suspended',
  });

  logger.info('Reseller suspended', { resellerId: id });
  return reseller;
};

const changeResellerTier = async (id, tier) => {
  const reseller = await Reseller.findByPk(id);
  if (!reseller) {
    throw new Error('Reseller not found');
  }

  await reseller.update({
    tier,
  });

  logger.info('Reseller tier updated', { resellerId: id, tier });
  return reseller;
};

const setProductTierPrices = async (productId, prices) => {
  const transaction = await db.sequelize.transaction();
  try {
    for (const item of prices) {
      await ResellerTierPrice.upsert(
        {
          product_id: productId,
          tier: item.tier,
          reseller_price: item.reseller_price,
          is_active: true,
        },
        { transaction }
      );
    }
    await transaction.commit();
    logger.info('Reseller tier prices configured', { productId, priceCount: prices.length });
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to configure reseller tier prices', { error });
    throw error;
  }
};

const getProductTierPrices = async (productId) => {
  return await ResellerTierPrice.findAll({
    where: { product_id: productId },
  });
};

const toggleProductResellable = async (productId, isResellable) => {
  const [visibility] = await ResellerProductVisibility.upsert({
    product_id: productId,
    is_resellable: isResellable,
  });
  logger.info('Product visibility updated for resellers', { productId, isResellable });
  return visibility;
};

module.exports = {
  getAllResellers,
  getResellerDetail,
  approveReseller,
  rejectReseller,
  suspendReseller,
  changeResellerTier,
  setProductTierPrices,
  getProductTierPrices,
  toggleProductResellable,
};
