'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GoogleBusinessProducts', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      category: { type: Sequelize.STRING, allowNull: true },
      photo_url: { type: Sequelize.STRING, allowNull: true },
      cta_type: { type: Sequelize.STRING, allowNull: true, defaultValue: 'SHOP' },
      cta_url: { type: Sequelize.STRING, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_posted: { type: Sequelize.BOOLEAN, defaultValue: false },
      posted_at: { type: Sequelize.DATE, allowNull: true },
      posted_location: { type: Sequelize.STRING, allowNull: true },
      post_name: { type: Sequelize.STRING, allowNull: true },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('GoogleBusinessProducts');
  }
};
