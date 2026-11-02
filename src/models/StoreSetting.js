const { Model, DataTypes } = require('sequelize');

class StoreSetting extends Model {}

const initStoreSetting = (sequelize) => {
  StoreSetting.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      value: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'StoreSettings' }
  );
  return StoreSetting;
};

module.exports = { initStoreSetting };
module.exports.default = StoreSetting;
