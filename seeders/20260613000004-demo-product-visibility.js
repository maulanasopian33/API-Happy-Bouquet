'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Fetch existing product IDs from the database
    const productsData = await queryInterface.sequelize.query(
      'SELECT id FROM Products;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (productsData.length === 0) {
      return;
    }

    const visibilities = productsData.map(product => ({
      product_id: product.id,
      is_resellable: true,
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('ResellerProductVisibility', visibilities, {});
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.bulkDelete('ResellerProductVisibility', null, {});
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
