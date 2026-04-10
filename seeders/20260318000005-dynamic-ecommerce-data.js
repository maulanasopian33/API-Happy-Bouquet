'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Categories
    const categories = await queryInterface.bulkInsert('Categories', [
      { name: 'Buket Bunga', icon: 'Flower', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Buket Uang', icon: 'Banknote', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Buket Snack', icon: 'Cookie', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Hampers', icon: 'Gift', createdAt: new Date(), updatedAt: new Date() }
    ], { returning: true });

    // 2. Hero Banners
    await queryInterface.bulkInsert('HeroBanners', [
      { 
        imageUrl: '/public/uploads/banner-1.jpg', 
        title: 'Special Mother\'s Day', 
        link: '/category/1', 
        order: 1, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      },
      { 
        imageUrl: '/public/uploads/banner-2.jpg', 
        title: 'Graduation Season', 
        link: '/category/2', 
        order: 2, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      }
    ]);

    // 3. Promos
    await queryInterface.bulkInsert('Promos', [
      { 
        id: uuidv4(),
        name: 'Diskon Pengguna Baru', 
        code: 'HAPPYNEW', 
        type: 'percentage', 
        value: 10, 
        minOrderAmount: 50000, 
        startDate: new Date(), 
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: 'active',
        createdAt: new Date(), 
        updatedAt: new Date() 
      },
      { 
        id: uuidv4(),
        name: 'Ramadan Sale', 
        code: 'RAMADAN2026', 
        type: 'fixed_amount', 
        value: 25000, 
        minOrderAmount: 150000, 
        startDate: new Date(), 
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: 'active',
        createdAt: new Date(), 
        updatedAt: new Date() 
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('HeroBanners', null, {});
    await queryInterface.bulkDelete('Promos', null, {});
  }
};
