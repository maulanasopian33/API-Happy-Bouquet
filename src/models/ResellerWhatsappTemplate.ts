import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface ResellerWhatsappTemplateAttributes {
  id: number;
  reseller_id: number;
  template: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResellerWhatsappTemplateCreationAttributes
  extends Optional<ResellerWhatsappTemplateAttributes, 'id' | 'template'> {}

class ResellerWhatsappTemplate extends Model<
  ResellerWhatsappTemplateAttributes,
  ResellerWhatsappTemplateCreationAttributes
> implements ResellerWhatsappTemplateAttributes {
  public id!: number;
  public reseller_id!: number;
  public template!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initResellerWhatsappTemplate = (sequelize: Sequelize) => {
  ResellerWhatsappTemplate.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      reseller_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      template: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Halo kak {reseller_name}, saya ingin pesan:\n🌸 {product_name}\n💰 Rp {price}',
      },
    },
    {
      sequelize,
      tableName: 'ResellerWhatsappTemplates',
    }
  );
  return ResellerWhatsappTemplate;
};

export default ResellerWhatsappTemplate;
