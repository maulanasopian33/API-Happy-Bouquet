import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type TransactionType = 'credit' | 'debit';
export type ReferenceType = 'order' | 'cost_item' | 'profit_allocation' | 'manual';

interface FundTransactionAttributes {
  id: number;
  fund_account_id: number;
  amount: number;
  type: TransactionType;
  reference_type: ReferenceType;
  reference_id?: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FundTransactionCreationAttributes extends Optional<FundTransactionAttributes, 'id'> {}

class FundTransaction
  extends Model<FundTransactionAttributes, FundTransactionCreationAttributes>
  implements FundTransactionAttributes
{
  public id!: number;
  public fund_account_id!: number;
  public amount!: number;
  public type!: TransactionType;
  public reference_type!: ReferenceType;
  public reference_id!: number;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initFundTransaction = (sequelize: Sequelize) => {
  FundTransaction.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      fund_account_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      type: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false },
      reference_type: {
        type: DataTypes.ENUM('order', 'cost_item', 'profit_allocation', 'manual'),
        allowNull: false,
      },
      reference_id: { type: DataTypes.INTEGER, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'FundTransactions' }
  );
  return FundTransaction;
};

export default FundTransaction;
