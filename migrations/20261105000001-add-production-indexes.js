'use strict';

/**
 * Migrasi penambahan indeks database MySQL untuk kesiapan production:
 * - AnalyticsLogs: mempercepat query analitik trafik, corong konversi, & durasi sesi
 * - PublicOrders: mempercepat filter order publik berdasarkan status & tanggal
 * - Orders: mempercepat query pelaporan & ringkasan penjualan
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();

    // 1. Indeks pada AnalyticsLogs
    if (tables.includes('AnalyticsLogs')) {
      try {
        await queryInterface.addIndex('AnalyticsLogs', ['timestamp', 'is_bot'], {
          name: 'idx_analytics_logs_ts_bot',
        });
      } catch (e) {
        console.warn('Index idx_analytics_logs_ts_bot already exists or skipped:', e.message);
      }

      try {
        await queryInterface.addIndex('AnalyticsLogs', ['session_id'], {
          name: 'idx_analytics_logs_session_id',
        });
      } catch (e) {
        console.warn('Index idx_analytics_logs_session_id already exists or skipped:', e.message);
      }

      try {
        await queryInterface.addIndex('AnalyticsLogs', ['event_type', 'event_name'], {
          name: 'idx_analytics_logs_event',
        });
      } catch (e) {
        console.warn('Index idx_analytics_logs_event already exists or skipped:', e.message);
      }
    }

    // 2. Indeks pada PublicOrders
    if (tables.includes('PublicOrders')) {
      try {
        await queryInterface.addIndex('PublicOrders', ['createdAt', 'status'], {
          name: 'idx_public_orders_created_status',
        });
      } catch (e) {
        console.warn('Index idx_public_orders_created_status already exists or skipped:', e.message);
      }
    }

    // 3. Indeks pada Orders
    if (tables.includes('Orders')) {
      try {
        await queryInterface.addIndex('Orders', ['createdAt', 'status'], {
          name: 'idx_orders_created_status',
        });
      } catch (e) {
        console.warn('Index idx_orders_created_status already exists or skipped:', e.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('AnalyticsLogs', 'idx_analytics_logs_ts_bot');
    } catch (_) {}
    try {
      await queryInterface.removeIndex('AnalyticsLogs', 'idx_analytics_logs_session_id');
    } catch (_) {}
    try {
      await queryInterface.removeIndex('AnalyticsLogs', 'idx_analytics_logs_event');
    } catch (_) {}
    try {
      await queryInterface.removeIndex('PublicOrders', 'idx_public_orders_created_status');
    } catch (_) {}
    try {
      await queryInterface.removeIndex('Orders', 'idx_orders_created_status');
    } catch (_) {}
  },
};

