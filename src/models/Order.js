const { Model, DataTypes } = require('sequelize');

class Order extends Model {}

const initOrder = (sequelize) => {
  Order.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_code: { type: DataTypes.STRING, allowNull: false, unique: true },
      customer_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      total_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'in_production', 'completed', 'cancelled'),
        defaultValue: 'pending',
      },
      payment_status: {
        type: DataTypes.ENUM('unpaid', 'paid'),
        defaultValue: 'unpaid',
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      order_type: {
        type: DataTypes.ENUM('direct', 'reseller'),
        allowNull: false,
        defaultValue: 'direct',
      },
      reseller_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reseller_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      client_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      client_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      payment_proof_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      reseller_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    { sequelize, tableName: 'Orders' }
  );
  return Order;
};

module.exports = { initOrder };
module.exports.default = Order;
