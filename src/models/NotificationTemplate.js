const { Model, DataTypes } = require('sequelize');

class NotificationTemplate extends Model {}

const initNotificationTemplate = (sequelize) => {
  NotificationTemplate.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      channel: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'NotificationTemplates',
      updatedAt: false,
    }
  );
  return NotificationTemplate;
};

module.exports = { initNotificationTemplate };
module.exports.default = NotificationTemplate;
