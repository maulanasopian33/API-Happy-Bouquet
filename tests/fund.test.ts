import db from '../src/models';
import * as fundService from '../src/services/fundService';

describe('Fund Service', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    
    // Setup Fund Account
    await db.FundAccount.create({ 
      name: 'Modal Test', 
      fund_type: 'capital', 
      balance: 100000 
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('harus menambah saldo dengan creditFund', async () => {
    await fundService.creditFund('capital', 50000, 'manual', 0, 'Tambah modal');
    
    const fund = await db.FundAccount.findOne({ where: { fund_type: 'capital' } });
    expect(Number(fund.balance)).toBe(150000);

    const trx = await db.FundTransaction.findOne({ where: { fund_account_id: fund.id, type: 'credit' } });
    expect(trx.amount).toBe(50000);
  });

  it('harus mengurangi saldo dengan debitFund', async () => {
    await fundService.debitFund('capital', 30000, 'manual', 0, 'Beli kertas');
    
    const fund = await db.FundAccount.findOne({ where: { fund_type: 'capital' } });
    expect(Number(fund.balance)).toBe(120000);
  });

  it('harus gagal jika debit melebihi saldo', async () => {
    await expect(
      fundService.debitFund('capital', 200000, 'manual', 0, 'Beli emas')
    ).rejects.toThrow(/Saldo kas "capital" tidak cukup/);
  });

  it('harus bisa mengambil ringkasan dana', async () => {
    const summary = await fundService.getFundsSummary();
    expect(summary.funds.length).toBe(1);
    expect(summary.total).toBe(120000);
  });
});
