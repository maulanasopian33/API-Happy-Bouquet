const { Model, DataTypes } = require('sequelize');

class Reseller extends Model {}

const initReseller = (sequelize) => {
  Reseller.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      shop_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      shop_logo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      shop_bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      whatsapp_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      tier: {
        type: DataTypes.ENUM('silver', 'gold', 'platinum'),
        allowNull: false,
        defaultValue: 'silver',
      },
      status: {
        type: DataTypes.ENUM('pending_review', 'active', 'suspended', 'rejected'),
        allowNull: false,
        defaultValue: 'pending_review',
      },
      is_catalog_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      total_orders: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'Resellers',
    }
  );
  return Reseller;
};

module.exports = { initReseller };
module.exports.default = Reseller;
