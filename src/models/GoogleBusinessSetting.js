const { Model, DataTypes } = require('sequelize');

class GoogleBusinessSetting extends Model {}

const initGoogleBusinessSetting = (sequelize) => {
  GoogleBusinessSetting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      google_account_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      google_account_email: {
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
      scope: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'business.manage',
      },
      default_location_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'GoogleBusinessSettings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return GoogleBusinessSetting;
};

module.exports = { initGoogleBusinessSetting };
module.exports.default = GoogleBusinessSetting;
