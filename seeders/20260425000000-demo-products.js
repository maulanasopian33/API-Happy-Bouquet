'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = [];
    const images = [
      '/public/uploads/red-roses.png',
      '/public/uploads/sunflower.png',
      '/public/uploads/lily.png',
      '/public/uploads/orchid.png',
      '/public/uploads/mixed-spring.png'
    ];
    
    const baseNames = [
      'Buket Mawar Merah Eksklusif',
      'Buket Bunga Matahari Cerah',
      'Buket Lily Putih Elegan',
      'Buket Anggrek Ungu Mewah',
      'Buket Bunga Musim Semi Campur'
    ];
    
    const descriptions = [
      'Buket bunga mawar merah segar pilihan, dirangkai dengan cantik dan elegan, cocok untuk hadiah ulang tahun atau hari kasih sayang.',
      'Rangkaian bunga matahari segar yang melambangkan kehangatan dan kebahagiaan, cocok untuk kelulusan.',
      'Buket bunga lily putih murni yang elegan, memberikan kesan mewah dan menenangkan.',
      'Anggrek ungu yang menawan, hadiah yang sempurna untuk orang spesial di hari istimewa.',
      'Kombinasi berbagai bunga musim semi yang ceria dan penuh warna, memberikan kesan segar dan bahagia.'
    ];

    // Fetch existing category IDs from the database
    const categoriesData = await queryInterface.sequelize.query(
      'SELECT id FROM Categories;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    // Default fallback if no categories exist (though there should be)
    const categoryIds = categoriesData.length > 0 ? categoriesData.map(c => c.id) : [1];

    for (let i = 0; i < 30; i++) {
      const typeIndex = i % 5;
      
      // randomize price between 100000 and 500000
      const price = Math.floor(Math.random() * 40) * 10000 + 100000;
      
      // Randomly pick a category ID from the existing ones
      const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];

      const name = `${baseNames[typeIndex]} - Edisi ${i + 1}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      products.push({
        name: name,
        slug: slug,
        description: descriptions[typeIndex],
        price: price,
        photo_url: images[typeIndex],
        category_id: categoryId,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Products', products, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
