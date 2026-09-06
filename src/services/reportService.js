const db = require('../models');
const { Op } = require('sequelize');

const Order = db.Order;
const OrderCostItem = db.OrderCostItem;
const FundAccount = db.FundAccount;
const ProfitAllocation = db.ProfitAllocation;

const getGlobalSummary = async () => {
  const sequelize = db.sequelize;

  const funds = await FundAccount.findAll();
  const fundSummary = funds.reduce((acc, f) => {
    acc[f.fund_type] = { name: f.name, balance: Number(f.balance), id: f.id };
    return acc;
  }, {});

  const [revenueResult] = await sequelize.query(
    `SELECT COALESCE(SUM(total_price), 0) as total FROM Orders WHERE payment_status = 'paid'`
  );
  const totalRevenue = Number(revenueResult[0]?.total || 0);

  const [cogsResult] = await sequelize.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM OrderCostItems WHERE cost_type IN ('material', 'overhead')`
  );
  const totalCOGS = Number(cogsResult[0]?.total || 0);

  const [laborResult] = await sequelize.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM OrderCostItems WHERE cost_type = 'labor'`
  );
  const totalLabor = Number(laborResult[0]?.total || 0);

  const [unpaidLaborResult] = await sequelize.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM OrderCostItems WHERE cost_type = 'labor' AND is_paid = false`
  );
  const outstandingWorkerFees = Number(unpaidLaborResult[0]?.total || 0);

  const capitalFund = funds.find((f) => f.fund_type === 'capital');
  const [reinvestResult] = await sequelize.query(
    `SELECT COALESCE(SUM(pa.amount), 0) as total 
     FROM ProfitAllocations pa 
     WHERE pa.fund_account_id = ${capitalFund ? capitalFund.id : 0}`
  );
  const reinvestedProfit = Number(reinvestResult[0]?.total || 0);

  const totalOrders = await Order.count();
  const paidOrders = await Order.count({ where: { payment_status: 'paid' } });
  const pendingOrders = await Order.count({ where: { status: 'pending' } });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const totalOrdersToday = await Order.count({
    where: {
      createdAt: {
        [Op.gte]: todayStart
      }
    }
  });

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalLabor;

  return {
    total_orders: totalOrders,
    total_orders_today: totalOrdersToday,
    paid_orders: paidOrders,
    pending_orders: pendingOrders,
    total_revenue: totalRevenue,
    total_cogs: totalCOGS,
    total_labor_cost: totalLabor,
    gross_profit: grossProfit,
    net_profit: netProfit,
    outstanding_worker_fees: outstandingWorkerFees,
    reinvested_profit: reinvestedProfit,
    fund_accounts: fundSummary,
  };
};

const getOrderFinancialReport = async (orderId) => {
  const { calculateOrderProfit } = require('./profitService');
  const profitData = await calculateOrderProfit(orderId);

  const order = await Order.findByPk(orderId, {
    include: [
      { model: db.Product, as: 'product' },
      { model: db.User, as: 'customer', attributes: ['id', 'name', 'email'] },
      { model: OrderCostItem, as: 'costItems' },
    ],
  });

  return {
    order,
    financials: profitData,
  };
};

const getOrdersProfitList = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Order.findAndCountAll({
    where: { payment_status: 'paid' },
    include: [
      { model: OrderCostItem, as: 'costItems' },
      { model: db.Product, as: 'product' },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const ordersWithProfit = rows.map((order) => {
    const revenue = Number(order.total_price);
    const cogs = (order.costItems || [])
      .filter((c) => ['material', 'overhead'].includes(c.cost_type))
      .reduce((s, c) => s + Number(c.amount), 0);
    const labor = (order.costItems || [])
      .filter((c) => c.cost_type === 'labor')
      .reduce((s, c) => s + Number(c.amount), 0);
    return {
      id: order.id,
      order_code: order.order_code,
      product_name: order.product?.name,
      total_price: revenue,
      cogs,
      labor_cost: labor,
      gross_profit: revenue - cogs,
      net_profit: revenue - cogs - labor,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.createdAt,
    };
  });

  return { orders: ordersWithProfit, total: count, page, totalPages: Math.ceil(count / limit) };
};

const getBalanceSheet = async () => {
  const funds = await FundAccount.findAll();
  
  const totalAssets = funds.reduce((sum, f) => sum + Number(f.balance), 0);
  const assetDetails = funds.map((f) => ({
    name: f.name,
    balance: Number(f.balance)
  }));

  const [laborResult] = await db.sequelize.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM OrderCostItems WHERE cost_type = 'labor' AND is_paid = false`
  );
  const totalLiabilities = Number(laborResult[0]?.total || 0);

  const totalEquity = totalAssets - totalLiabilities;

  return {
    date: new Date(),
    assets: {
      total: totalAssets,
      details: assetDetails
    },
    liabilities: {
      total: totalLiabilities,
      description: 'Hutang Upah Pekerja (Belum Dibayar)'
    },
    equity: {
      total: totalEquity,
      formula: 'Aset - Kewajiban'
    },
    is_balanced: true
  };
};

module.exports = {
  getGlobalSummary,
  getOrderFinancialReport,
  getOrdersProfitList,
  getBalanceSheet,
};
