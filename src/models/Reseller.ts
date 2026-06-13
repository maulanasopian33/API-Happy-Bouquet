import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type ResellerTier = 'silver' | 'gold' | 'platinum';
export type ResellerStatus = 'pending_review' | 'active' | 'suspended' | 'rejected';

export interface ResellerAttributes {
  id: number;
  user_id: number;
  slug: string;
  shop_name: string;
  shop_logo_url: string | null;
  shop_bio: string | null;
  whatsapp_number: string;
  tier: ResellerTier;
  status: ResellerStatus;
  is_catalog_public: boolean;
  total_orders: number;
  approved_at: Date | null;
  approved_by: number | null;
  rejection_reason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResellerCreationAttributes
  extends Optional<
    ResellerAttributes,
    | 'id'
    | 'shop_logo_url'
    | 'shop_bio'
    | 'tier'
    | 'status'
    | 'is_catalog_public'
    | 'total_orders'
    | 'approved_at'
    | 'approved_by'
    | 'rejection_reason'
  > {}

class Reseller extends Model<ResellerAttributes, ResellerCreationAttributes> implements ResellerAttributes {
  public id!: number;
  public user_id!: number;
  public slug!: string;
  public shop_name!: string;
  public shop_logo_url!: string | null;
  public shop_bio!: string | null;
  public whatsapp_number!: string;
  public tier!: ResellerTier;
  public status!: ResellerStatus;
  public is_catalog_public!: boolean;
  public total_orders!: number;
  public approved_at!: Date | null;
  public approved_by!: number | null;
  public rejection_reason!: string | null;
  public user?: any;
  public catalogSetting?: any;
  public whatsappTemplate?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initReseller = (sequelize: Sequelize) => {
  Reseller.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      shop_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      shop_logo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      shop_bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      whatsapp_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      tier: {
        type: DataTypes.ENUM('silver', 'gold', 'platinum'),
        allowNull: false,
        defaultValue: 'silver',
      },
      status: {
        type: DataTypes.ENUM('pending_review', 'active', 'suspended', 'rejected'),
        allowNull: false,
        defaultValue: 'pending_review',
      },
      is_catalog_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      total_orders: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'Resellers',
    }
  );
  return Reseller;
};

export default Reseller;
