const { Model, DataTypes } = require('sequelize');

class OrderChannel extends Model {}

const initOrderChannel = (sequelize) => {
  OrderChannel.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      icon_url: { type: DataTypes.STRING, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { sequelize, tableName: 'OrderChannels' }
  );
  return OrderChannel;
};

module.exports = { initOrderChannel };
module.exports.default = OrderChannel;
