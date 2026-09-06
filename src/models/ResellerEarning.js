const { Model, DataTypes } = require('sequelize');

class ResellerEarning extends Model {}

const initResellerEarning = (sequelize) => {
  ResellerEarning.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      reseller_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reseller_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      public_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      margin_per_unit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      total_margin: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'earned', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      earned_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'ResellerEarnings',
      updatedAt: false,
    }
  );
  return ResellerEarning;
};

module.exports = { initResellerEarning };
module.exports.default = ResellerEarning;
