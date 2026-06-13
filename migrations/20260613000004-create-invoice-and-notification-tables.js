'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Invoices
    await queryInterface.createTable('Invoices', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      invoice_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'Orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      pdf_file_path: { type: Sequelize.STRING(500), allowNull: false },
      issued_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 2. NotificationTemplates
    await queryInterface.createTable('NotificationTemplates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      code: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      channel: { type: Sequelize.STRING(30), allowNull: false },
      subject: { type: Sequelize.STRING(255), allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 3. NotificationLogs
    await queryInterface.createTable('NotificationLogs', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      recipient: { type: Sequelize.STRING(255), allowNull: false },
      channel: { type: Sequelize.STRING(30), allowNull: false },
      template_code: { type: Sequelize.STRING(100), allowNull: true },
      subject: { type: Sequelize.STRING(255), allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'pending' },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('NotificationLogs', ['status'], { name: 'idx_notif_logs_status' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('NotificationLogs');
    await queryInterface.dropTable('NotificationTemplates');
    await queryInterface.dropTable('Invoices');
  }
};
