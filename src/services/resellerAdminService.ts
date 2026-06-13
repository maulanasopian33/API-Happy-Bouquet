import db from '../models';
import logger from '../utils/logger';
import { sendInAppNotification, sendEmailNotification } from './notificationService';

const User = db.User;
const Reseller = db.Reseller;
const ResellerTierPrice = db.ResellerTierPrice;
const ResellerProductVisibility = db.ResellerProductVisibility;

export const getAllResellers = async (filter: any = {}) => {
  const where: any = {};
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

export const getResellerDetail = async (id: number) => {
  const reseller = await Reseller.findByPk(id, {
    include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }],
  });
  if (!reseller) {
    throw new Error('Reseller not found');
  }
  return reseller;
};

export const approveReseller = async (id: number, adminId: number) => {
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

  // Send notifications
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

export const rejectReseller = async (id: number, reason: string) => {
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

  // Send in-app notification
  try {
    await sendInAppNotification(reseller.user_id, 'reseller_rejected', { reason });
  } catch (notifErr) {
    logger.error('Gagal mengirim notifikasi rejection reseller', { resellerId: id, error: notifErr });
  }

  logger.info('Reseller rejected', { resellerId: id, reason });
  return reseller;
};

export const suspendReseller = async (id: number) => {
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

export const changeResellerTier = async (id: number, tier: 'silver' | 'gold' | 'platinum') => {
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

export const setProductTierPrices = async (productId: number, prices: Array<{ tier: 'silver' | 'gold' | 'platinum', reseller_price: number }>) => {
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

export const getProductTierPrices = async (productId: number) => {
  return await ResellerTierPrice.findAll({
    where: { product_id: productId },
  });
};

export const toggleProductResellable = async (productId: number, isResellable: boolean) => {
  const [visibility] = await ResellerProductVisibility.upsert({
    product_id: productId,
    is_resellable: isResellable,
  });
  logger.info('Product visibility updated for resellers', { productId, isResellable });
  return visibility;
};
