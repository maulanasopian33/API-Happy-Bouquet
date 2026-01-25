import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface MaterialAttributes {
  id: number;
  name: string;
  photo_url: string;
  stock: number;
  unit: string;
  price_per_unit: number;
  min_stock: number;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id'> {}

class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number;
  public name!: string;
  public photo_url!: string;
  public stock!: number;
  public unit!: string;
  public price_per_unit!: number;
  public min_stock!: number;
  public category!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initMaterial = (sequelize: Sequelize) => {
  Material.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      photo_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price_per_unit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      min_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'Materials',
    }
  );
  return Material;
};

export default Material;
