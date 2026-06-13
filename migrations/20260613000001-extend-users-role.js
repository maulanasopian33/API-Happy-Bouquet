'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Extend role enum to support new roles
    // MySQL approach: ALTER COLUMN to change ENUM values
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: 'customer',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'customer',
    });
  }
};
