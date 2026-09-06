const { Model, DataTypes } = require('sequelize');

class AnalyticsLog extends Model {}

const initAnalyticsLog = (sequelize) => {
  AnalyticsLog.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      referrer: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      event_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      scroll_depth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      device_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      browser: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      os: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      utm_source: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      utm_medium: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      utm_campaign: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'AnalyticsLogs',
    }
  );
  return AnalyticsLog;
};

module.exports = { initAnalyticsLog };
module.exports.default = AnalyticsLog;
