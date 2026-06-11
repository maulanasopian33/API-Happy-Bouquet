'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Update Products Table
    await queryInterface.addColumn('Products', 'type', {
      type: Sequelize.ENUM('ready', 'preorder'),
      allowNull: false,
      defaultValue: 'ready'
    });
    await queryInterface.addColumn('Products', 'preorder_duration', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // 2. Create OrderChannels Table
    await queryInterface.createTable('OrderChannels', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      icon_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 3. Create ProductOrderChannels Table (Pivot)
    await queryInterface.createTable('ProductOrderChannels', {
      product_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      channel_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'OrderChannels', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      store_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ProductOrderChannels');
    await queryInterface.dropTable('OrderChannels');
    await queryInterface.removeColumn('Products', 'preorder_duration');
    await queryInterface.removeColumn('Products', 'type');
    // Note: To truly remove an ENUM in MySQL, sometimes you need extra steps, 
    // but removeColumn usually handles it.
  }
};
