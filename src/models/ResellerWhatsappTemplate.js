const { Model, DataTypes } = require('sequelize');

class ResellerWhatsappTemplate extends Model {}

const initResellerWhatsappTemplate = (sequelize) => {
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

module.exports = { initResellerWhatsappTemplate };
module.exports.default = ResellerWhatsappTemplate;
