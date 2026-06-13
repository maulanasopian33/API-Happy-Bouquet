import db from '../models';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

const User = db.User;
const Reseller = db.Reseller;
const ResellerCatalogSetting = db.ResellerCatalogSetting;
const ResellerWhatsappTemplate = db.ResellerWhatsappTemplate;
const ResellerEarning = db.ResellerEarning;
const Order = db.Order;

export const registerReseller = async (data: any) => {
  const transaction = await db.sequelize.transaction();
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await User.create(
      {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'reseller',
        phone: data.phone || data.whatsapp_number,
      },
      { transaction }
    );

    // Create reseller profile
    const reseller = await Reseller.create(
      {
        user_id: user.id,
        slug: data.slug,
        shop_name: data.shop_name,
        whatsapp_number: data.whatsapp_number,
        shop_bio: data.shop_bio || null,
        tier: 'silver',
        status: 'pending_review',
        is_catalog_public: true,
        total_orders: 0,
        shop_logo_url: null,
        approved_at: null,
        approved_by: null,
        rejection_reason: null,
      },
      { transaction }
    );

    // Create default catalog settings
    await ResellerCatalogSetting.create(
      {
        reseller_id: reseller.id,
        accent_color: '#FF6B9D',
        show_price: true,
        show_stock: false,
        custom_cta_text: 'Pesan via WhatsApp',
        is_closed: false,
        closed_message: 'Toko sedang tutup sementara',
      },
      { transaction }
    );

    // Create default WhatsApp template
    await ResellerWhatsappTemplate.create(
      {
        reseller_id: reseller.id,
        template: 'Halo kak {reseller_name}, saya ingin pesan:\n🌸 {product_name}\n💰 Rp {price}',
      },
      { transaction }
    );

    await transaction.commit();
    logger.info('Reseller registered successfully', { userId: user.id, resellerId: reseller.id });
    return reseller;
  } catch (error) {
    await transaction.rollback();
    logger.error('Reseller registration failed', { error });
    throw error;
  }
};

export const getResellerProfileByUserId = async (userId: number) => {
  return await Reseller.findOne({
    where: { user_id: userId },
    include: [
      { model: User, as: 'user', attributes: ['name', 'email', 'phone'] },
      { model: ResellerCatalogSetting, as: 'catalogSetting' },
      { model: ResellerWhatsappTemplate, as: 'whatsappTemplate' },
    ],
  });
};

export const updateResellerProfile = async (resellerId: number, data: any) => {
  const reseller = await Reseller.findByPk(resellerId);
  if (!reseller) {
    throw new Error('Reseller profile not found');
  }

  await reseller.update(data);
  logger.info('Reseller profile updated', { resellerId });
  return reseller;
};

export const getDashboardStats = async (resellerId: number) => {
  const reseller = await Reseller.findByPk(resellerId);
  if (!reseller) {
    throw new Error('Reseller not found');
  }

  // Count earnings
  const earnedStats: any = await ResellerEarning.findAll({
    where: { reseller_id: resellerId, status: 'earned' },
    attributes: [
      [db.sequelize.fn('SUM', db.sequelize.col('total_margin')), 'totalEarned'],
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalCompletedOrders'],
    ],
    raw: true,
  });

  const pendingStats: any = await ResellerEarning.findAll({
    where: { reseller_id: resellerId, status: 'pending' },
    attributes: [[db.sequelize.fn('SUM', db.sequelize.col('total_margin')), 'totalPending']],
    raw: true,
  });

  const totalEarned = Number(earnedStats[0]?.totalEarned || 0);
  const totalPending = Number(pendingStats[0]?.totalPending || 0);

  // Recent orders
  const recentOrders = await Order.findAll({
    where: { reseller_id: resellerId },
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  return {
    shop_name: reseller.shop_name,
    tier: reseller.tier,
    status: reseller.status,
    total_orders: reseller.total_orders,
    earnings: {
      earned: totalEarned,
      pending: totalPending,
      total: totalEarned + totalPending,
    },
    recent_orders: recentOrders,
  };
};
