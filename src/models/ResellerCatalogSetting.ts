import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface ResellerCatalogSettingAttributes {
  id: number;
  reseller_id: number;
  banner_url: string | null;
  accent_color: string;
  show_price: boolean;
  show_stock: boolean;
  custom_cta_text: string;
  featured_product_ids: number[] | null;
  announcement_text: string | null;
  is_closed: boolean;
  closed_message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResellerCatalogSettingCreationAttributes
  extends Optional<
    ResellerCatalogSettingAttributes,
    | 'id'
    | 'banner_url'
    | 'accent_color'
    | 'show_price'
    | 'show_stock'
    | 'custom_cta_text'
    | 'featured_product_ids'
    | 'announcement_text'
    | 'is_closed'
    | 'closed_message'
  > {}

class ResellerCatalogSetting extends Model<
  ResellerCatalogSettingAttributes,
  ResellerCatalogSettingCreationAttributes
> implements ResellerCatalogSettingAttributes {
  public id!: number;
  public reseller_id!: number;
  public banner_url!: string | null;
  public accent_color!: string;
  public show_price!: boolean;
  public show_stock!: boolean;
  public custom_cta_text!: string;
  public featured_product_ids!: number[] | null;
  public announcement_text!: string | null;
  public is_closed!: boolean;
  public closed_message!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initResellerCatalogSetting = (sequelize: Sequelize) => {
  ResellerCatalogSetting.init(
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
      banner_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      accent_color: {
        type: DataTypes.STRING(7),
        allowNull: false,
        defaultValue: '#FF6B9D',
      },
      show_price: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      show_stock: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      custom_cta_text: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Pesan via WhatsApp',
      },
      featured_product_ids: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      announcement_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_closed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      closed_message: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Toko sedang tutup sementara',
      },
    },
    {
      sequelize,
      tableName: 'ResellerCatalogSettings',
    }
  );
  return ResellerCatalogSetting;
};

export default ResellerCatalogSetting;
