import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface ResellerClientAttributes {
  id: number;
  reseller_id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  total_orders: number;
  last_order_at: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResellerClientCreationAttributes
  extends Optional<
    ResellerClientAttributes,
    'id' | 'email' | 'address' | 'city' | 'notes' | 'total_orders' | 'last_order_at'
  > {}

class ResellerClient extends Model<ResellerClientAttributes, ResellerClientCreationAttributes>
  implements ResellerClientAttributes {
  public id!: number;
  public reseller_id!: number;
  public name!: string;
  public phone!: string;
  public email!: string | null;
  public address!: string | null;
  public city!: string | null;
  public notes!: string | null;
  public total_orders!: number;
  public last_order_at!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initResellerClient = (sequelize: Sequelize) => {
  ResellerClient.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      reseller_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total_orders: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      last_order_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'ResellerClients',
    }
  );
  return ResellerClient;
};

export default ResellerClient;
