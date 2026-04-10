'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const funds = [
      {
        name: 'Modal Usaha',
        fund_type: 'capital',
        balance: 10000000, // Saldo awal simulasi 10jt
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Dana Fee Pekerja',
        fund_type: 'worker_fee',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Profit Pemilik',
        fund_type: 'owner_profit',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Dana Operasional',
        fund_type: 'operational',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Dana Investasi / Cadangan',
        fund_type: 'investment',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('FundAccounts', funds, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FundAccounts', null, {});
  },
};
