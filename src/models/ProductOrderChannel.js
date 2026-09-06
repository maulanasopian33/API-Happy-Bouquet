const { Model, DataTypes } = require('sequelize');

class ProductOrderChannel extends Model {}

const initProductOrderChannel = (sequelize) => {
  ProductOrderChannel.init(
    {
      product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'Products', key: 'id' }
      },
      channel_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'OrderChannels', key: 'id' }
      },
      store_url: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'ProductOrderChannels' }
  );
  return ProductOrderChannel;
};

module.exports = { initProductOrderChannel };
module.exports.default = ProductOrderChannel;
