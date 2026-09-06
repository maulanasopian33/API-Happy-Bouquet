const { Model, DataTypes } = require('sequelize');

class NotificationLog extends Model {}

const initNotificationLog = (sequelize) => {
  NotificationLog.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      recipient: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      channel: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      template_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pending',
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'NotificationLogs',
      updatedAt: false,
    }
  );
  return NotificationLog;
};

module.exports = { initNotificationLog };
module.exports.default = NotificationLog;
