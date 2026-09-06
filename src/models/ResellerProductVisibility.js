const { Model, DataTypes } = require('sequelize');

class ResellerProductVisibility extends Model {}

const initResellerProductVisibility = (sequelize) => {
  ResellerProductVisibility.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      is_resellable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'ResellerProductVisibility',
      createdAt: false,
    }
  );
  return ResellerProductVisibility;
};

module.exports = { initResellerProductVisibility };
module.exports.default = ResellerProductVisibility;
