import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { CostType } from './ProductCostTemplate';

interface OrderCostItemAttributes {
  id: number;
  order_id: number;
  name: string;
  cost_type: CostType;
  amount: number;
  is_paid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCostItemCreationAttributes extends Optional<OrderCostItemAttributes, 'id' | 'is_paid'> {}

class OrderCostItem
  extends Model<OrderCostItemAttributes, OrderCostItemCreationAttributes>
  implements OrderCostItemAttributes
{
  public id!: number;
  public order_id!: number;
  public name!: string;
  public cost_type!: CostType;
  public amount!: number;
  public is_paid!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initOrderCostItem = (sequelize: Sequelize) => {
  OrderCostItem.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      cost_type: { type: DataTypes.ENUM('material', 'labor', 'overhead'), allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      is_paid: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { sequelize, tableName: 'OrderCostItems' }
  );
  return OrderCostItem;
};

export default OrderCostItem;
