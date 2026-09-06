const { Model, DataTypes } = require('sequelize');

class Invoice extends Model {}

const initInvoice = (sequelize) => {
  Invoice.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      invoice_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      pdf_file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'Invoices',
      updatedAt: false,
    }
  );
  return Invoice;
};

module.exports = { initInvoice };
module.exports.default = Invoice;
