import { Model, DataTypes, Sequelize } from 'sequelize';

interface ProductOrderChannelAttributes {
  product_id: number;
  channel_id: number;
  store_url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class ProductOrderChannel extends Model<ProductOrderChannelAttributes> implements ProductOrderChannelAttributes {
  public product_id!: number;
  public channel_id!: number;
  public store_url!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initProductOrderChannel = (sequelize: Sequelize) => {
  ProductOrderChannel.init(
    {
      product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'Products', key: 'id' }
      },
      channel_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'OrderChannels', key: 'id' }
      },
      store_url: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'ProductOrderChannels' }
  );
  return ProductOrderChannel;
};

export default ProductOrderChannel;
