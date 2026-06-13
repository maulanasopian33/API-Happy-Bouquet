'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Extend Orders table with reseller-specific columns
    await queryInterface.addColumn('Orders', 'order_type', {
      type: Sequelize.ENUM('direct', 'reseller'),
      allowNull: false,
      defaultValue: 'direct',
    });
    await queryInterface.addColumn('Orders', 'reseller_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Resellers', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('Orders', 'reseller_price', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'client_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'ResellerClients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('Orders', 'client_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'client_phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'client_address', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'payment_proof_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'reseller_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addIndex('Orders', ['order_type'], { name: 'idx_orders_type' });
    await queryInterface.addIndex('Orders', ['reseller_id'], { name: 'idx_orders_reseller_id' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Orders', 'idx_orders_reseller_id');
    await queryInterface.removeIndex('Orders', 'idx_orders_type');
    await queryInterface.removeColumn('Orders', 'reseller_notes');
    await queryInterface.removeColumn('Orders', 'payment_proof_url');
    await queryInterface.removeColumn('Orders', 'client_address');
    await queryInterface.removeColumn('Orders', 'client_phone');
    await queryInterface.removeColumn('Orders', 'client_name');
    await queryInterface.removeColumn('Orders', 'client_id');
    await queryInterface.removeColumn('Orders', 'reseller_price');
    await queryInterface.removeColumn('Orders', 'reseller_id');
    await queryInterface.removeColumn('Orders', 'order_type');
  }
};
