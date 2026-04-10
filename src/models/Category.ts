import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface CategoryAttributes {
  id: number;
  name: string;
  icon?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public icon!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initCategory = (sequelize: Sequelize) => {
  Category.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'Categories' }
  );
  return Category;
};

export default Category;
