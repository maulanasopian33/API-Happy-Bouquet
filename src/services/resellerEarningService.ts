import db from '../models';

const ResellerEarning = db.ResellerEarning;

export const getEarnings = async (resellerId: number, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await ResellerEarning.findAndCountAll({
    where: { reseller_id: resellerId },
    include: [{ model: db.Product, as: 'product', attributes: ['id', 'name', 'price'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    earnings: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};

export const getEarningsSummary = async (resellerId: number) => {
  const earned = await ResellerEarning.sum('total_margin', {
    where: { reseller_id: resellerId, status: 'earned' },
  });
  const pending = await ResellerEarning.sum('total_margin', {
    where: { reseller_id: resellerId, status: 'pending' },
  });

  return {
    earned: Number(earned || 0),
    pending: Number(pending || 0),
    total: Number(earned || 0) + Number(pending || 0),
  };
};
