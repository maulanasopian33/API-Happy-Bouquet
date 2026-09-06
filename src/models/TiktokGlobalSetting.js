const { Model, DataTypes } = require('sequelize');

class TiktokGlobalSetting extends Model {}

const initTiktokGlobalSetting = (sequelize) => {
  TiktokGlobalSetting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tiktok_open_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tiktok_username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      access_token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      refresh_expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'TiktokGlobalSettings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return TiktokGlobalSetting;
};

module.exports = { initTiktokGlobalSetting };
module.exports.default = TiktokGlobalSetting;
