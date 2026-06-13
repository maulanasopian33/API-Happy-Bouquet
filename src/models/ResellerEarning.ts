import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type EarningStatus = 'pending' | 'earned' | 'cancelled';

export interface ResellerEarningAttributes {
  id: number;
  reseller_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  reseller_price: number;
  public_price: number;
  margin_per_unit: number;
  total_margin: number;
  status: EarningStatus;
  earned_at: Date | null;
  createdAt?: Date;
}

export interface ResellerEarningCreationAttributes
  extends Optional<ResellerEarningAttributes, 'id' | 'status' | 'earned_at'> {}

class ResellerEarning extends Model<ResellerEarningAttributes, ResellerEarningCreationAttributes>
  implements ResellerEarningAttributes {
  public id!: number;
  public reseller_id!: number;
  public order_id!: number;
  public product_id!: number;
  public quantity!: number;
  public reseller_price!: number;
  public public_price!: number;
  public margin_per_unit!: number;
  public total_margin!: number;
  public status!: EarningStatus;
  public earned_at!: Date | null;
  public readonly createdAt!: Date;
}

export const initResellerEarning = (sequelize: Sequelize) => {
  ResellerEarning.init(
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
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reseller_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      public_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      margin_per_unit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      total_margin: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'earned', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      earned_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'ResellerEarnings',
      updatedAt: false, // In migration, ResellerEarnings only has createdAt
    }
  );
  return ResellerEarning;
};

export default ResellerEarning;
