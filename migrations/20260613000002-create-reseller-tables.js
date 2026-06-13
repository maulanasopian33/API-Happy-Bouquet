'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Resellers
    await queryInterface.createTable('Resellers', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      shop_name: { type: Sequelize.STRING(255), allowNull: false },
      shop_logo_url: { type: Sequelize.STRING(500), allowNull: true },
      shop_bio: { type: Sequelize.TEXT, allowNull: true },
      whatsapp_number: { type: Sequelize.STRING(20), allowNull: false },
      tier: {
        type: Sequelize.ENUM('silver', 'gold', 'platinum'),
        allowNull: false, defaultValue: 'silver'
      },
      status: {
        type: Sequelize.ENUM('pending_review', 'active', 'suspended', 'rejected'),
        allowNull: false, defaultValue: 'pending_review'
      },
      is_catalog_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      total_orders: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      approved_by: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      rejection_reason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('Resellers', ['status'], { name: 'idx_resellers_status' });
    await queryInterface.addIndex('Resellers', ['slug'], { name: 'idx_resellers_slug' });

    // 2. ResellerTierPrices
    await queryInterface.createTable('ResellerTierPrices', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      tier: { type: Sequelize.ENUM('silver', 'gold', 'platinum'), allowNull: false },
      reseller_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addConstraint('ResellerTierPrices', {
      fields: ['product_id', 'tier'], type: 'unique', name: 'uq_product_tier'
    });
    await queryInterface.addIndex('ResellerTierPrices', ['product_id', 'tier'], { name: 'idx_tier_prices_lookup' });

    // 3. ResellerClients
    await queryInterface.createTable('ResellerClients', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      reseller_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Resellers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      total_orders: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      last_order_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('ResellerClients', ['reseller_id'], { name: 'idx_clients_reseller_id' });
    await queryInterface.addIndex('ResellerClients', ['phone'], { name: 'idx_clients_phone' });

    // 4. ResellerWhatsappTemplates
    await queryInterface.createTable('ResellerWhatsappTemplates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      reseller_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'Resellers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      template: {
        type: Sequelize.TEXT, allowNull: false,
        defaultValue: 'Halo kak {reseller_name}, saya ingin pesan:\n🌸 {product_name}\n💰 Rp {price}'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    // 5. ResellerCatalogSettings
    await queryInterface.createTable('ResellerCatalogSettings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      reseller_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'Resellers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      banner_url: { type: Sequelize.STRING(500), allowNull: true },
      accent_color: { type: Sequelize.STRING(7), allowNull: false, defaultValue: '#FF6B9D' },
      show_price: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      show_stock: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      custom_cta_text: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'Pesan via WhatsApp' },
      featured_product_ids: { type: Sequelize.JSON, allowNull: true },
      announcement_text: { type: Sequelize.TEXT, allowNull: true },
      is_closed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      closed_message: { type: Sequelize.STRING(255), allowNull: false, defaultValue: 'Toko sedang tutup sementara' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    // 6. ResellerEarnings
    await queryInterface.createTable('ResellerEarnings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      reseller_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Resellers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      order_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Orders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      reseller_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      public_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      margin_per_unit: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      total_margin: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'earned', 'cancelled'),
        allowNull: false, defaultValue: 'pending'
      },
      earned_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('ResellerEarnings', ['reseller_id', 'status'], { name: 'idx_earnings_reseller_status' });
    await queryInterface.addIndex('ResellerEarnings', ['order_id'], { name: 'idx_earnings_order_id' });

    // 7. ResellerProductVisibility
    await queryInterface.createTable('ResellerProductVisibility', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'Products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      is_resellable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ResellerProductVisibility');
    await queryInterface.dropTable('ResellerEarnings');
    await queryInterface.dropTable('ResellerCatalogSettings');
    await queryInterface.dropTable('ResellerWhatsappTemplates');
    await queryInterface.dropTable('ResellerClients');
    await queryInterface.dropTable('ResellerTierPrices');
    await queryInterface.dropTable('Resellers');
  }
};
