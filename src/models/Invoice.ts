import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InvoiceAttributes {
  id: number;
  invoice_number: string;
  order_id: number;
  total_amount: number;
  pdf_file_path: string;
  issued_at: Date;
  createdAt?: Date;
}

export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'issued_at'> {}

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: number;
  public invoice_number!: string;
  public order_id!: number;
  public total_amount!: number;
  public pdf_file_path!: string;
  public issued_at!: Date;
  public readonly createdAt!: Date;
}

export const initInvoice = (sequelize: Sequelize) => {
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
      updatedAt: false, // Table only has createdAt and issued_at
    }
  );
  return Invoice;
};

export default Invoice;
