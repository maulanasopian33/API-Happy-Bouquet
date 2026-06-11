import { Model, DataTypes, Sequelize } from 'sequelize';

export class TiktokGlobalSetting extends Model {
  public id!: number;
  public tiktok_open_id!: string;
  public tiktok_username!: string | null;
  public access_token!: string;
  public refresh_token!: string;
  public expires_at!: Date;
  public refresh_expires_at!: Date;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initTiktokGlobalSetting = (sequelize: Sequelize) => {
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
