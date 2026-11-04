'use strict';

/**
 * Migrasi penambahan kolom kustomisasi produk:
 * - gallery_urls: galeri multi image foto produk (JSON array)
 * - variants: varian ukuran/tangkai, warna wrapping, dan add-ons (JSON object)
 * - specifications: spesifikasi teknis dan instruksi perawatan (JSON object)
 * - stock: jumlah stok inventaris produk
 * - rating: skor ulasan produk
 * - review_count: total jumlah ulasan pembeli
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Products');

    if (!tableInfo.gallery_urls) {
      await queryInterface.addColumn('Products', 'gallery_urls', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!tableInfo.variants) {
      await queryInterface.addColumn('Products', 'variants', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!tableInfo.specifications) {
      await queryInterface.addColumn('Products', 'specifications', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!tableInfo.stock) {
      await queryInterface.addColumn('Products', 'stock', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
      });
    }

    if (!tableInfo.rating) {
      await queryInterface.addColumn('Products', 'rating', {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 4.9,
      });
    }

    if (!tableInfo.review_count) {
      await queryInterface.addColumn('Products', 'review_count', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  down: async (queryInterface) => {
    try { await queryInterface.removeColumn('Products', 'gallery_urls'); } catch (_) {}
    try { await queryInterface.removeColumn('Products', 'variants'); } catch (_) {}
    try { await queryInterface.removeColumn('Products', 'specifications'); } catch (_) {}
    try { await queryInterface.removeColumn('Products', 'stock'); } catch (_) {}
    try { await queryInterface.removeColumn('Products', 'rating'); } catch (_) {}
    try { await queryInterface.removeColumn('Products', 'review_count'); } catch (_) {}
  },
};

