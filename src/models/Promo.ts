import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface PromoAttributes {
  id: string; // PRM-XXXX
  name: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minOrderAmount: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromoCreationAttributes extends Optional<PromoAttributes, 'status' | 'minOrderAmount'> {}

class Promo extends Model<PromoAttributes, PromoCreationAttributes> implements PromoAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public type!: 'percentage' | 'fixed_amount';
  public value!: number;
  public minOrderAmount!: number;
  public startDate!: Date;
  public endDate!: Date;
  public status!: 'active' | 'inactive';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initPromo = (sequelize: Sequelize) => {
  Promo.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      type: { type: DataTypes.ENUM('percentage', 'fixed_amount'), allowNull: false },
      value: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      minOrderAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      startDate: { type: DataTypes.DATE, allowNull: false },
      endDate: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
    },
    { sequelize, tableName: 'Promos' }
  );
  return Promo;
};

export default Promo;
