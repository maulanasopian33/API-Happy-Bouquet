const { Model, DataTypes } = require('sequelize');

class OrderCostItem extends Model {}

const initOrderCostItem = (sequelize) => {
  OrderCostItem.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      cost_type: { type: DataTypes.ENUM('material', 'labor', 'overhead'), allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      is_paid: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { sequelize, tableName: 'OrderCostItems' }
  );
  return OrderCostItem;
};

module.exports = { initOrderCostItem };
module.exports.default = OrderCostItem;
