import db from '../models';

const Order = db.Order;
const OrderCostItem = db.OrderCostItem;

// ─── Kalkulasi Profit per Order (DINAMIS — tidak disimpan) ────────

export const calculateOrderProfit = async (orderId: number) => {
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderCostItem, as: 'costItems' }],
  });
  if (!order) throw new Error('Order tidak ditemukan');

  const revenue = Number(order.total_price);
  const costItems: any[] = (order as any).costItems || [];

  const cogs = costItems
    .filter((c) => ['material', 'overhead'].includes(c.cost_type))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const laborCost = costItems
    .filter((c) => c.cost_type === 'labor')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const unpaidLaborCost = costItems
    .filter((c) => c.cost_type === 'labor' && !c.is_paid)
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - laborCost;

  // Cek apakah profit sudah dialokasikan
  const ProfitAllocation = db.ProfitAllocation;
  const FundAccount = db.FundAccount;
  const allocations = await ProfitAllocation.findAll({
    where: { order_id: orderId },
    include: [{ model: FundAccount, as: 'fundAccount' }],
  });
  const totalAllocated = allocations.reduce((sum: number, a: any) => sum + Number(a.amount), 0);

  return {
    order_id: orderId,
    order_code: order.order_code,
    revenue,
    cogs,
    labor_cost: laborCost,
    unpaid_labor_cost: unpaidLaborCost,
    gross_profit: grossProfit,
    net_profit: netProfit,
    total_allocated: totalAllocated,
    remaining_to_allocate: netProfit - totalAllocated,
    is_fully_allocated: totalAllocated >= netProfit,
    allocations,
  };
};

// ─── Alokasi Profit Manual oleh Pemilik ──────────────────────────

export const allocateProfit = async (
  orderId: number,
  allocations: Array<{ fund_account_id: number; amount: number }>
) => {
  const ProfitAllocation = db.ProfitAllocation;
  const FundAccount = db.FundAccount;
  const sequelize = db.sequelize;
  const { creditFundById } = await import('./fundService');

  // Kalkulasi nilai profit terkini
  const profitData = await calculateOrderProfit(orderId);

  // Validasi total alokasi tidak melebihi net profit
  const totalToAllocate = allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  if (totalToAllocate > profitData.remaining_to_allocate) {
    throw new Error(
      `Total alokasi (${totalToAllocate}) melebihi sisa profit yang bisa dialokasikan (${profitData.remaining_to_allocate})`
    );
  }

  const t = await sequelize.transaction();
  try {
    const created = [];
    for (const alloc of allocations) {
      const fund = await FundAccount.findByPk(alloc.fund_account_id, { transaction: t });
      if (!fund) throw new Error(`Kas dengan id ${alloc.fund_account_id} tidak ditemukan`);

      // Simpan record alokasi
      const record = await ProfitAllocation.create(
        { order_id: orderId, fund_account_id: alloc.fund_account_id, amount: alloc.amount },
        { transaction: t }
      );
      created.push(record);

      // Kredit kas tujuan
      await creditFundById(
        alloc.fund_account_id,
        alloc.amount,
        'profit_allocation',
        orderId,
        `Alokasi profit order #${orderId} ke ${fund.name}`,
        t
      );
    }

    await t.commit();
    return created;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
