'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const password = await bcrypt.hash('password123', 10);
    
    return queryInterface.bulkInsert('Users', [
      {
        name: 'Admin User',
        email: 'admin@happybouquet.com',
        password: password,
        role: 'admin',
        phone: '081234567890',
        address: 'Head Office',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Customer User',
        email: 'customer@test.com',
        password: password,
        role: 'customer',
        phone: '08987654321',
        address: 'Jl. Mawar No. 1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
