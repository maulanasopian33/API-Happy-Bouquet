import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type FundType = 'capital' | 'worker_fee' | 'owner_profit' | 'operational' | 'investment';

interface FundAccountAttributes {
  id: number;
  name: string;
  fund_type: FundType;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FundAccountCreationAttributes extends Optional<FundAccountAttributes, 'id' | 'balance'> {}

class FundAccount
  extends Model<FundAccountAttributes, FundAccountCreationAttributes>
  implements FundAccountAttributes
{
  public id!: number;
  public name!: string;
  public fund_type!: FundType;
  public balance!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initFundAccount = (sequelize: Sequelize) => {
  FundAccount.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      fund_type: {
        type: DataTypes.ENUM('capital', 'worker_fee', 'owner_profit', 'operational', 'investment'),
        allowNull: false,
      },
      balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    },
    { sequelize, tableName: 'FundAccounts' }
  );
  return FundAccount;
};

export default FundAccount;
