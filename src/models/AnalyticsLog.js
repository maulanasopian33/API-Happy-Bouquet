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
      event_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      event_data: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      scroll_depth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      screen_size: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      language: {
        type: DataTypes.STRING(20),
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
      is_bot: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      bot_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bot_category: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      threat_level: {
        type: DataTypes.STRING(20),
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
