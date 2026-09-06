const { Model, DataTypes } = require('sequelize');

class HeroBanner extends Model {}

const initHeroBanner = (sequelize) => {
  HeroBanner.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      imageUrl: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: true },
      link: { type: DataTypes.STRING, allowNull: true },
      order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { sequelize, tableName: 'HeroBanners' }
  );
  return HeroBanner;
};

module.exports = { initHeroBanner };
module.exports.default = HeroBanner;
