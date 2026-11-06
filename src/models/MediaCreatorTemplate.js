const { Model, DataTypes } = require('sequelize');

class MediaCreatorTemplate extends Model {}

const initMediaCreatorTemplate = (sequelize) => {
  MediaCreatorTemplate.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      width: { type: DataTypes.INTEGER, allowNull: false },
      height: { type: DataTypes.INTEGER, allowNull: false },
      watermark_media_id: { type: DataTypes.INTEGER, allowNull: true },
      watermark_position: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'bottom-right',
      },
      watermark_x: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      watermark_y: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      watermark_scale: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 18 },
      watermark_opacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 80 },
      margin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 32 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      tableName: 'MediaCreatorTemplates',
      indexes: [{ fields: ['is_active'] }],
    }
  );
  return MediaCreatorTemplate;
};

module.exports = { initMediaCreatorTemplate };
module.exports.default = MediaCreatorTemplate;
