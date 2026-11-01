const { Model, DataTypes } = require('sequelize');

class PublicOrder extends Model {}

const initPublicOrder = (sequelize) => {
  PublicOrder.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_number: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      // Data pelanggan (tanpa akun, langsung dari form checkout)
      customer_name: { type: DataTypes.STRING(255), allowNull: false },
      customer_phone: { type: DataTypes.STRING(30), allowNull: false },
      delivery_address: { type: DataTypes.TEXT, allowNull: true },
      delivery_date: { type: DataTypes.DATEONLY, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      // Ringkasan item (JSON array [{name, qty, price}])
      items: { type: DataTypes.JSON, allowNull: false },
      total_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      payment_type: {
        type: DataTypes.ENUM('dp', 'full'),
        defaultValue: 'dp',
      },
      channel: {
        type: DataTypes.ENUM('Web', 'WhatsApp', 'Shopee', 'TikTok'),
        defaultValue: 'Web',
      },
      status: {
        type: DataTypes.ENUM('pending_payment', 'confirmed', 'in_production', 'completed', 'cancelled'),
        defaultValue: 'pending_payment',
      },
    },
    { sequelize, tableName: 'PublicOrders' }
  );
  return PublicOrder;
};

module.exports = { initPublicOrder };
module.exports.default = PublicOrder;

