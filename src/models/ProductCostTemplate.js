const { Model, DataTypes } = require('sequelize');

class ProductCostTemplate extends Model {}

const initProductCostTemplate = (sequelize) => {
  ProductCostTemplate.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      cost_type: { type: DataTypes.ENUM('material', 'labor', 'overhead'), allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    },
    { sequelize, tableName: 'ProductCostTemplates' }
  );
  return ProductCostTemplate;
};

module.exports = { initProductCostTemplate };
module.exports.default = ProductCostTemplate;
