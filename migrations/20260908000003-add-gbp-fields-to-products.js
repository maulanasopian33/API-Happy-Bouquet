'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'gbp_posted', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('Products', 'gbp_posted_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('Products', 'gbp_post_name', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Products', 'gbp_location', { type: Sequelize.STRING, allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Products', 'gbp_posted');
    await queryInterface.removeColumn('Products', 'gbp_posted_at');
    await queryInterface.removeColumn('Products', 'gbp_post_name');
    await queryInterface.removeColumn('Products', 'gbp_location');
  }
};
