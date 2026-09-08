const { Model, DataTypes } = require('sequelize');

class GoogleBusinessProduct extends Model {}

const initGoogleBusinessProduct = (sequelize) => {
  GoogleBusinessProduct.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      category: { type: DataTypes.STRING, allowNull: true },
      photo_url: { type: DataTypes.STRING, allowNull: true },
      cta_type: { type: DataTypes.STRING, allowNull: true, defaultValue: 'SHOP' },
      cta_url: { type: DataTypes.STRING, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_posted: { type: DataTypes.BOOLEAN, defaultValue: false },
      posted_at: { type: DataTypes.DATE, allowNull: true },
      posted_location: { type: DataTypes.STRING, allowNull: true },
      post_name: { type: DataTypes.STRING, allowNull: true },
      updated_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      tableName: 'GoogleBusinessProducts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return GoogleBusinessProduct;
};

module.exports = { initGoogleBusinessProduct };
module.exports.default = GoogleBusinessProduct;
