const { Model, DataTypes } = require('sequelize');

class FundAccount extends Model {}

const initFundAccount = (sequelize) => {
  FundAccount.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      fund_type: {
        type: DataTypes.ENUM('capital', 'worker_fee', 'owner_profit', 'operational', 'investment'),
        allowNull: false,
      },
      balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    },
    { sequelize, tableName: 'FundAccounts' }
  );
  return FundAccount;
};

module.exports = { initFundAccount };
module.exports.default = FundAccount;
