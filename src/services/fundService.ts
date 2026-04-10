import { Transaction } from 'sequelize';
import db from '../models';
import logger from '../utils/logger';
import { FundType } from '../models/FundAccount';
import { ReferenceType } from '../models/FundTransaction';

const FundAccount = db.FundAccount;
const FundTransaction = db.FundTransaction;

// ─── Helper: ambil fund account berdasarkan fund_type ────────────

export const getFundByType = async (fundType: FundType, t?: Transaction) => {
  const fund = await FundAccount.findOne({ where: { fund_type: fundType }, transaction: t, lock: t ? t.LOCK.UPDATE : undefined });
  if (!fund) throw new Error(`Kas "${fundType}" tidak ditemukan. Pastikan seeder sudah dijalankan.`);
  return fund;
};

export const getFundById = async (id: number, t?: Transaction) => {
  const fund = await FundAccount.findByPk(id, { transaction: t, lock: t ? t.LOCK.UPDATE : undefined });
  if (!fund) throw new Error('Kas tidak ditemukan');
  return fund;
};

export const getAllFundAccounts = async () => {
  return await FundAccount.findAll();
};

// ─── Kredit: menambah saldo kas ───────────────────────────────────

export const creditFund = async (
  fundType: FundType,
  amount: number,
  referenceType: ReferenceType,
  referenceId: number,
  description: string,
  t?: Transaction
) => {
  const fund = await getFundByType(fundType, t);
  const newBalance = Number(fund.balance) + Number(amount);
  await fund.update({ balance: newBalance }, { transaction: t });

  await FundTransaction.create(
    {
      fund_account_id: fund.id,
      amount,
      type: 'credit',
      reference_type: referenceType,
      reference_id: referenceId,
      description,
    },
    { transaction: t }
  );

  logger.info(`Kredit kas [${fundType}] +${amount}`, { fundId: fund.id, referenceType, referenceId });
  return fund;
};

// ─── Debit: mengurangi saldo kas ─────────────────────────────────

export const debitFund = async (
  fundType: FundType,
  amount: number,
  referenceType: ReferenceType,
  referenceId: number,
  description: string,
  t?: Transaction
) => {
  const fund = await getFundByType(fundType, t);
  if (Number(fund.balance) < Number(amount)) {
    throw new Error(`Saldo kas "${fundType}" tidak cukup. Saldo: ${fund.balance}, Dibutuhkan: ${amount}`);
  }

  const newBalance = Number(fund.balance) - Number(amount);
  await fund.update({ balance: newBalance }, { transaction: t });

  await FundTransaction.create(
    {
      fund_account_id: fund.id,
      amount,
      type: 'debit',
      reference_type: referenceType,
      reference_id: referenceId,
      description,
    },
    { transaction: t }
  );

  logger.info(`Debit kas [${fundType}] -${amount}`, { fundId: fund.id, referenceType, referenceId });
  return fund;
};

// ─── Manual Transactions (CRUD) ──────────────────────────────────

export const createManualTransaction = async (data: {
  fund_account_id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
}) => {
  const t = await db.sequelize.transaction();
  try {
    const fund = await getFundById(data.fund_account_id, t);
    
    // Update balance
    const amountNum = Number(data.amount);
    const newBalance = data.type === 'credit' 
      ? Number(fund.balance) + amountNum 
      : Number(fund.balance) - amountNum;
    
    if (newBalance < 0) throw new Error('Saldo kas tidak mencukupi untuk transaksi debit ini');
    
    await fund.update({ balance: newBalance }, { transaction: t });

    const transaction = await FundTransaction.create({
      fund_account_id: data.fund_account_id,
      amount: amountNum,
      type: data.type,
      reference_type: 'manual',
      reference_id: 0, // Manual doesn't have specific ref_id table
      description: data.description,
    }, { transaction: t });

    await t.commit();
    logger.info(`Transaksi manual [${fund.fund_type}] ${data.type} ${amountNum}`, { id: transaction.id });
    return transaction;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updateManualTransaction = async (id: number, data: Partial<{
  amount: number;
  type: 'credit' | 'debit';
  description: string;
}>) => {
  const t = await db.sequelize.transaction();
  try {
    const trx = await FundTransaction.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!trx) throw new Error('Transaksi tidak ditemukan');
    if (trx.reference_type !== 'manual') throw new Error('Hanya transaksi manual yang dapat diubah');

    const fund = await getFundById(trx.fund_account_id, t);
    
    // Reverse old balance
    let currentBalance = Number(fund.balance);
    if (trx.type === 'credit') currentBalance -= Number(trx.amount);
    else currentBalance += Number(trx.amount);

    // Apply new data
    const newAmount = data.amount !== undefined ? Number(data.amount) : Number(trx.amount);
    const newType = data.type || trx.type;
    const newDescription = data.description || trx.description;

    let finalBalance = currentBalance;
    if (newType === 'credit') finalBalance += newAmount;
    else finalBalance -= newAmount;

    if (finalBalance < 0) throw new Error('Saldo kas tidak mencukupi setelah penyesuaian ini');

    await fund.update({ balance: finalBalance }, { transaction: t });
    await trx.update({
      amount: newAmount,
      type: newType,
      description: newDescription
    }, { transaction: t });

    await t.commit();
    logger.info(`Transaksi manual #${id} diperbarui`, { newAmount, newType });
    return trx;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteManualTransaction = async (id: number) => {
  const t = await db.sequelize.transaction();
  try {
    const trx = await FundTransaction.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!trx) throw new Error('Transaksi tidak ditemukan');
    if (trx.reference_type !== 'manual') throw new Error('Hanya transaksi manual yang dapat dihapus');

    const fund = await getFundById(trx.fund_account_id, t);
    
    // Reverse balance
    let newBalance = Number(fund.balance);
    if (trx.type === 'credit') newBalance -= Number(trx.amount);
    else newBalance += Number(trx.amount);

    if (newBalance < 0) throw new Error('Tidak dapat menghapus transaksi: saldo kas hasil pembalikan akan negatif');

    await fund.update({ balance: newBalance }, { transaction: t });
    await trx.destroy({ transaction: t });

    await t.commit();
    logger.info(`Transaksi manual #${id} dihapus & saldo dipulihkan`);
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ─── Kredit by ID (untuk alokasi profit manual) ──────────────────

export const creditFundById = async (
  fundAccountId: number,
  amount: number,
  referenceType: ReferenceType,
  referenceId: number,
  description: string,
  t?: Transaction
) => {
  const fund = await getFundById(fundAccountId, t);
  const newBalance = Number(fund.balance) + Number(amount);
  await fund.update({ balance: newBalance }, { transaction: t });

  await FundTransaction.create(
    {
      fund_account_id: fund.id,
      amount,
      type: 'credit',
      reference_type: referenceType,
      reference_id: referenceId,
      description,
    },
    { transaction: t }
  );

  logger.info(`Kredit kas [id:${fundAccountId}] +${amount}`, { referenceType, referenceId });
  return fund;
};

// ─── Laporan saldo semua kas ──────────────────────────────────────

export const getFundsSummary = async () => {
  const funds = await FundAccount.findAll();
  const total = funds.reduce((sum: number, f: any) => sum + Number(f.balance), 0);
  return { funds, total };
};

export const getFundTransactions = async (fundAccountId: number, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const fund = await getFundById(fundAccountId);
  const { count, rows } = await FundTransaction.findAndCountAll({
    where: { fund_account_id: fundAccountId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return {
    fund,
    transactions: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};
