import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface HeroBannerAttributes {
  id: number;
  imageUrl: string;
  title?: string;
  link?: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HeroBannerCreationAttributes extends Optional<HeroBannerAttributes, 'id' | 'order'> {}

class HeroBanner extends Model<HeroBannerAttributes, HeroBannerCreationAttributes> implements HeroBannerAttributes {
  public id!: number;
  public imageUrl!: string;
  public title!: string;
  public link!: string;
  public order!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initHeroBanner = (sequelize: Sequelize) => {
  HeroBanner.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      imageUrl: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: true },
      link: { type: DataTypes.STRING, allowNull: true },
      order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { sequelize, tableName: 'HeroBanners' }
  );
  return HeroBanner;
};

export default HeroBanner;
