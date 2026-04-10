import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

interface OrderAttributes {
  id: number;
  order_code: string;
  customer_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'payment_status'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public order_code!: string;
  public customer_id!: number;
  public product_id!: number;
  public quantity!: number;
  public total_price!: number;
  public status!: OrderStatus;
  public payment_status!: PaymentStatus;
  public notes!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initOrder = (sequelize: Sequelize) => {
  Order.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_code: { type: DataTypes.STRING, allowNull: false, unique: true },
      customer_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      total_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'in_production', 'completed', 'cancelled'),
        defaultValue: 'pending',
      },
      payment_status: {
        type: DataTypes.ENUM('unpaid', 'paid'),
        defaultValue: 'unpaid',
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'Orders' }
  );
  return Order;
};

export default Order;
