const { Model, DataTypes } = require('sequelize');

class Product extends Model {}

const initProduct = (sequelize) => {
  Product.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      photo_url: { type: DataTypes.STRING, allowNull: true },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Categories', key: 'id' }
      },
      type: {
        type: DataTypes.ENUM('ready', 'preorder'),
        allowNull: false,
        defaultValue: 'ready'
      },
      preorder_duration: { type: DataTypes.INTEGER, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      gbp_posted: { type: DataTypes.BOOLEAN, defaultValue: false },
      gbp_posted_at: { type: DataTypes.DATE, allowNull: true },
      gbp_post_name: { type: DataTypes.STRING, allowNull: true },
      gbp_location: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'Products' }
  );
  return Product;
};

module.exports = { initProduct };
module.exports.default = Product;
