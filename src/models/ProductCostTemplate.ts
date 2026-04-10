import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type CostType = 'material' | 'labor' | 'overhead';

interface ProductCostTemplateAttributes {
  id: number;
  product_id: number;
  name: string;
  cost_type: CostType;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCostTemplateCreationAttributes extends Optional<ProductCostTemplateAttributes, 'id'> {}

class ProductCostTemplate
  extends Model<ProductCostTemplateAttributes, ProductCostTemplateCreationAttributes>
  implements ProductCostTemplateAttributes
{
  public id!: number;
  public product_id!: number;
  public name!: string;
  public cost_type!: CostType;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initProductCostTemplate = (sequelize: Sequelize) => {
  ProductCostTemplate.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      cost_type: { type: DataTypes.ENUM('material', 'labor', 'overhead'), allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    },
    { sequelize, tableName: 'ProductCostTemplates' }
  );
  return ProductCostTemplate;
};

export default ProductCostTemplate;
