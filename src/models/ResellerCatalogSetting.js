const { Model, DataTypes } = require('sequelize');

class ResellerCatalogSetting extends Model {}

const initResellerCatalogSetting = (sequelize) => {
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

module.exports = { initResellerCatalogSetting };
module.exports.default = ResellerCatalogSetting;
