const { Model, DataTypes } = require('sequelize');

class FundTransaction extends Model {}

const initFundTransaction = (sequelize) => {
  FundTransaction.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      fund_account_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      type: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false },
      reference_type: {
        type: DataTypes.ENUM('order', 'cost_item', 'profit_allocation', 'manual'),
        allowNull: false,
      },
      reference_id: { type: DataTypes.INTEGER, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'FundTransactions' }
  );
  return FundTransaction;
};

module.exports = { initFundTransaction };
module.exports.default = FundTransaction;
