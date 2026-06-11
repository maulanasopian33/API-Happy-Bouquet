import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface OrderChannelAttributes {
  id: number;
  name: string;
  icon_url?: string;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderChannelCreationAttributes extends Optional<OrderChannelAttributes, 'id' | 'is_active'> {}

class OrderChannel extends Model<OrderChannelAttributes, OrderChannelCreationAttributes> implements OrderChannelAttributes {
  public id!: number;
  public name!: string;
  public icon_url!: string;
  public is_active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initOrderChannel = (sequelize: Sequelize) => {
  OrderChannel.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      icon_url: { type: DataTypes.STRING, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { sequelize, tableName: 'OrderChannels' }
  );
  return OrderChannel;
};

export default OrderChannel;
