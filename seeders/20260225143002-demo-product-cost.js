'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Insert Product
    await queryInterface.bulkInsert('Products', [
      {
        id: 1,
        name: 'Buket Mawar Merah Premium',
        description: 'Buket 20 tangkai mawar merah dengan wrapping premium (Skenario Tutorial)',
        price: 350000,
        photo_url: null,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 2. Insert Cost Templates
    await queryInterface.bulkInsert('ProductCostTemplates', [
      {
        product_id: 1,
        name: 'Mawar Merah (20 tangkai)',
        cost_type: 'material',
        amount: 100000, // Rp 100.000
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        product_id: 1,
        name: 'Wrapping & Pita',
        cost_type: 'material',
        amount: 25000,  // Rp 25.000
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        product_id: 1,
        name: 'Pupuk & Air',
        cost_type: 'overhead',
        amount: 5000,   // Rp 5.000
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        product_id: 1,
        name: 'Upah Rangkai Florist',
        cost_type: 'labor',
        amount: 50000,  // Rp 50.000
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductCostTemplates', null, {});
    await queryInterface.bulkDelete('Products', null, {});
  },
};
