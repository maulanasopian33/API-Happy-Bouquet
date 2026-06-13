import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ResellerTier } from './Reseller';

export interface ResellerTierPriceAttributes {
  id: number;
  product_id: number;
  tier: ResellerTier;
  reseller_price: number;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResellerTierPriceCreationAttributes
  extends Optional<ResellerTierPriceAttributes, 'id' | 'is_active'> {}

class ResellerTierPrice extends Model<ResellerTierPriceAttributes, ResellerTierPriceCreationAttributes>
  implements ResellerTierPriceAttributes {
  public id!: number;
  public product_id!: number;
  public tier!: ResellerTier;
  public reseller_price!: number;
  public is_active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initResellerTierPrice = (sequelize: Sequelize) => {
  ResellerTierPrice.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tier: {
        type: DataTypes.ENUM('silver', 'gold', 'platinum'),
        allowNull: false,
      },
      reseller_price: {
        type: DataTypes.DECIMAL(15, 2),
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
      tableName: 'ResellerTierPrices',
    }
  );
  return ResellerTierPrice;
};

export default ResellerTierPrice;
