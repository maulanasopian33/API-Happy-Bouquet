const { Model, DataTypes } = require('sequelize');

class Promo extends Model {}

const initPromo = (sequelize) => {
  Promo.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      type: { type: DataTypes.ENUM('percentage', 'fixed_amount'), allowNull: false },
      value: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      minOrderAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      startDate: { type: DataTypes.DATE, allowNull: false },
      endDate: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
    },
    { sequelize, tableName: 'Promos' }
  );
  return Promo;
};

module.exports = { initPromo };
module.exports.default = Promo;
