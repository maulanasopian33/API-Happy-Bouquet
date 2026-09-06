const { Model, DataTypes } = require('sequelize');

class ProfitAllocation extends Model {}

const initProfitAllocation = (sequelize) => {
  ProfitAllocation.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      fund_account_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    },
    { sequelize, tableName: 'ProfitAllocations' }
  );
  return ProfitAllocation;
};

module.exports = { initProfitAllocation };
module.exports.default = ProfitAllocation;
