'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GoogleBusinessSettings', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      google_account_id: { type: Sequelize.STRING, allowNull: true },
      google_account_email: { type: Sequelize.STRING, allowNull: true },
      access_token: { type: Sequelize.TEXT, allowNull: false },
      refresh_token: { type: Sequelize.TEXT, allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      scope: { type: Sequelize.STRING, allowNull: true, defaultValue: 'business.manage' },
      default_location_name: { type: Sequelize.STRING, allowNull: true },
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GoogleBusinessSettings');
  }
};
