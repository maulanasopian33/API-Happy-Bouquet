'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Material extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Material.init({
    name: DataTypes.STRING,
    photo_url: DataTypes.STRING,
    stock: DataTypes.INTEGER,
    unit: DataTypes.STRING,
    price_per_unit: DataTypes.DECIMAL,
    min_stock: DataTypes.INTEGER,
    category: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Material',
  });
  return Material;
};