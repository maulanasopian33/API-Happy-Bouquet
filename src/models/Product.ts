import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface ProductAttributes {
  id: number;
  name: string;
  description?: string;
  price: number;
  photo_url?: string;
  category_id?: number;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'is_active'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public photo_url!: string;
  public category_id!: number;
  public is_active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initProduct = (sequelize: Sequelize) => {
  Product.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      photo_url: { type: DataTypes.STRING, allowNull: true },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Categories', key: 'id' }
      },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { sequelize, tableName: 'Products' }
  );
  return Product;
};

export default Product;
