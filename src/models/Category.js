const { Model, DataTypes } = require('sequelize');

class Category extends Model {}

const initCategory = (sequelize) => {
  Category.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'Categories' }
  );
  return Category;
};

module.exports = { initCategory };
module.exports.default = Category;
