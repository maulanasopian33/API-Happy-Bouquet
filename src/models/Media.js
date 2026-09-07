const { Model, DataTypes } = require('sequelize');

class Media extends Model {}

const initMedia = (sequelize) => {
  Media.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      filename: { type: DataTypes.STRING, allowNull: false },
      originalName: { type: DataTypes.STRING, allowNull: false },
      mimeType: { type: DataTypes.STRING, allowNull: false },
      size: { type: DataTypes.INTEGER, allowNull: false },
      path: { type: DataTypes.STRING, allowNull: false },
      alt: { type: DataTypes.STRING, allowNull: true },
      uploadedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' }
      },
    },
    { sequelize, tableName: 'Media' }
  );
  return Media;
};

module.exports = { initMedia };
module.exports.default = Media;
