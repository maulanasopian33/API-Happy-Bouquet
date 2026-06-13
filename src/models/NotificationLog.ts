import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface NotificationLogAttributes {
  id: number;
  user_id: number | null;
  recipient: string;
  channel: string;
  template_code: string | null;
  subject: string | null;
  body: string;
  status: string;
  sent_at: Date | null;
  error_message: string | null;
  createdAt?: Date;
}

export interface NotificationLogCreationAttributes
  extends Optional<
    NotificationLogAttributes,
    'id' | 'user_id' | 'template_code' | 'subject' | 'status' | 'sent_at' | 'error_message'
  > {}

class NotificationLog extends Model<NotificationLogAttributes, NotificationLogCreationAttributes>
  implements NotificationLogAttributes {
  public id!: number;
  public user_id!: number | null;
  public recipient!: string;
  public channel!: string;
  public template_code!: string | null;
  public subject!: string | null;
  public body!: string;
  public status!: string;
  public sent_at!: Date | null;
  public error_message!: string | null;
  public readonly createdAt!: Date;
}

export const initNotificationLog = (sequelize: Sequelize) => {
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

export default NotificationLog;
