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
  order_type: 'direct' | 'reseller';
  reseller_id?: number | null;
  reseller_price?: number | null;
  client_id?: number | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  payment_proof_url?: string | null;
  reseller_notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes
  extends Optional<
    OrderAttributes,
    | 'id'
    | 'status'
    | 'payment_status'
    | 'order_type'
    | 'reseller_id'
    | 'reseller_price'
    | 'client_id'
    | 'client_name'
    | 'client_phone'
    | 'client_address'
    | 'payment_proof_url'
    | 'reseller_notes'
  > {}

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
  public order_type!: 'direct' | 'reseller';
  public reseller_id!: number | null;
  public reseller_price!: number | null;
  public client_id!: number | null;
  public client_name!: string | null;
  public client_phone!: string | null;
  public client_address!: string | null;
  public payment_proof_url!: string | null;
  public reseller_notes!: string | null;
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
      order_type: {
        type: DataTypes.ENUM('direct', 'reseller'),
        allowNull: false,
        defaultValue: 'direct',
      },
      reseller_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reseller_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      client_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      client_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      payment_proof_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      reseller_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    { sequelize, tableName: 'Orders' }
  );
  return Order;
};

export default Order;
