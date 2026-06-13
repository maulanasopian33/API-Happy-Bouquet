import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface NotificationTemplateAttributes {
  id: number;
  code: string;
  channel: string;
  subject: string | null;
  body: string;
  is_active: boolean;
  createdAt?: Date;
}

export interface NotificationTemplateCreationAttributes
  extends Optional<NotificationTemplateAttributes, 'id' | 'subject' | 'is_active'> {}

class NotificationTemplate extends Model<
  NotificationTemplateAttributes,
  NotificationTemplateCreationAttributes
> implements NotificationTemplateAttributes {
  public id!: number;
  public code!: string;
  public channel!: string;
  public subject!: string | null;
  public body!: string;
  public is_active!: boolean;
  public readonly createdAt!: Date;
}

export const initNotificationTemplate = (sequelize: Sequelize) => {
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

export default NotificationTemplate;
