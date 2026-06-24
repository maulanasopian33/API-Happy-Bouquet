import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface AnalyticsLogAttributes {
  id?: number;
  session_id: string;
  url: string;
  referrer?: string;
  event_type: string;
  scroll_depth?: number;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AnalyticsLog extends Model<AnalyticsLogAttributes> implements AnalyticsLogAttributes {
  public id!: number;
  public session_id!: string;
  public url!: string;
  public referrer?: string;
  public event_type!: string;
  public scroll_depth?: number;
  public ip_address!: string;
  public user_agent!: string;
  public device_type!: string;
  public browser!: string;
  public os!: string;
  public country!: string;
  public city!: string;
  public utm_source?: string;
  public utm_medium?: string;
  public utm_campaign?: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

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
      type: DataTypes.STRING(45), // Support IPv6
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
    timestamps: true,
  }
);

export default AnalyticsLog;
