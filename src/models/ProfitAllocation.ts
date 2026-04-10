import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface ProfitAllocationAttributes {
  id: number;
  order_id: number;
  fund_account_id: number;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProfitAllocationCreationAttributes extends Optional<ProfitAllocationAttributes, 'id'> {}

class ProfitAllocation
  extends Model<ProfitAllocationAttributes, ProfitAllocationCreationAttributes>
  implements ProfitAllocationAttributes
{
  public id!: number;
  public order_id!: number;
  public fund_account_id!: number;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initProfitAllocation = (sequelize: Sequelize) => {
  ProfitAllocation.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      fund_account_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    },
    { sequelize, tableName: 'ProfitAllocations' }
  );
  return ProfitAllocation;
};

export default ProfitAllocation;
