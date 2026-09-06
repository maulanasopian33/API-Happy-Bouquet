const { Model, DataTypes } = require('sequelize');

class Material extends Model {}

const initMaterial = (sequelize) => {
  Material.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      photo_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price_per_unit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      min_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'Materials',
    }
  );
  return Material;
};

module.exports = { initMaterial };
module.exports.default = Material;
