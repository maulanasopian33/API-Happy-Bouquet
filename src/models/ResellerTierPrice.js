const { Model, DataTypes } = require('sequelize');

class ResellerTierPrice extends Model {}

const initResellerTierPrice = (sequelize) => {
  ResellerTierPrice.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tier: {
        type: DataTypes.ENUM('silver', 'gold', 'platinum'),
        allowNull: false,
      },
      reseller_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'ResellerTierPrices',
    }
  );
  return ResellerTierPrice;
};

module.exports = { initResellerTierPrice };
module.exports.default = ResellerTierPrice;
