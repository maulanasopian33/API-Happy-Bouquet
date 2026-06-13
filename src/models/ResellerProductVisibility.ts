import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface ResellerProductVisibilityAttributes {
  id: number;
  product_id: number;
  is_resellable: boolean;
  updatedAt?: Date;
}

export interface ResellerProductVisibilityCreationAttributes
  extends Optional<ResellerProductVisibilityAttributes, 'id' | 'is_resellable'> {}

class ResellerProductVisibility extends Model<
  ResellerProductVisibilityAttributes,
  ResellerProductVisibilityCreationAttributes
> implements ResellerProductVisibilityAttributes {
  public id!: number;
  public product_id!: number;
  public is_resellable!: boolean;
  public readonly updatedAt!: Date;
}

export const initResellerProductVisibility = (sequelize: Sequelize) => {
  ResellerProductVisibility.init(
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
        unique: true,
      },
      is_resellable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'ResellerProductVisibility',
      createdAt: false, // In migration, ResellerProductVisibility only has updatedAt
    }
  );
  return ResellerProductVisibility;
};

export default ResellerProductVisibility;
