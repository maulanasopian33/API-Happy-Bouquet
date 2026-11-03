'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Cek apakah tabel AnalyticsLogs sudah ada
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('AnalyticsLogs');

    if (!tableExists) {
      await queryInterface.createTable('AnalyticsLogs', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT,
        },
        session_id: { type: Sequelize.STRING(255), allowNull: false },
        url: { type: Sequelize.TEXT, allowNull: false },
        referrer: { type: Sequelize.TEXT, allowNull: true },
        event_type: { type: Sequelize.STRING(50), allowNull: false },
        event_name: { type: Sequelize.STRING(100), allowNull: true },
        event_data: { type: Sequelize.TEXT, allowNull: true },
        scroll_depth: { type: Sequelize.INTEGER, allowNull: true },
        duration_seconds: { type: Sequelize.INTEGER, allowNull: true },
        screen_size: { type: Sequelize.STRING(50), allowNull: true },
        language: { type: Sequelize.STRING(20), allowNull: true },
        ip_address: { type: Sequelize.STRING(45), allowNull: false },
        user_agent: { type: Sequelize.TEXT, allowNull: false },
        device_type: { type: Sequelize.STRING(50), allowNull: false },
        browser: { type: Sequelize.STRING(100), allowNull: false },
        os: { type: Sequelize.STRING(100), allowNull: false },
        country: { type: Sequelize.STRING(100), allowNull: false },
        city: { type: Sequelize.STRING(100), allowNull: false },
        utm_source: { type: Sequelize.STRING(100), allowNull: true },
        utm_medium: { type: Sequelize.STRING(100), allowNull: true },
        utm_campaign: { type: Sequelize.STRING(100), allowNull: true },
        is_bot: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        bot_name: { type: Sequelize.STRING(100), allowNull: true },
        bot_category: { type: Sequelize.STRING(50), allowNull: true },
        threat_level: { type: Sequelize.STRING(20), allowNull: true },
        timestamp: { type: Sequelize.DATE, allowNull: false },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      });
    } else {
      // Jika tabel sudah ada, tambahkan kolom-kolom baru
      const columns = await queryInterface.describeTable('AnalyticsLogs');

      if (!columns.is_bot) {
        await queryInterface.addColumn('AnalyticsLogs', 'is_bot', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
      }
      if (!columns.bot_name) {
        await queryInterface.addColumn('AnalyticsLogs', 'bot_name', {
          type: Sequelize.STRING(100),
          allowNull: true,
        });
      }
      if (!columns.bot_category) {
        await queryInterface.addColumn('AnalyticsLogs', 'bot_category', {
          type: Sequelize.STRING(50),
          allowNull: true,
        });
      }
      if (!columns.threat_level) {
        await queryInterface.addColumn('AnalyticsLogs', 'threat_level', {
          type: Sequelize.STRING(20),
          allowNull: true,
        });
      }
      if (!columns.event_name) {
        await queryInterface.addColumn('AnalyticsLogs', 'event_name', {
          type: Sequelize.STRING(100),
          allowNull: true,
        });
      }
      if (!columns.event_data) {
        await queryInterface.addColumn('AnalyticsLogs', 'event_data', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
      if (!columns.duration_seconds) {
        await queryInterface.addColumn('AnalyticsLogs', 'duration_seconds', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      if (!columns.screen_size) {
        await queryInterface.addColumn('AnalyticsLogs', 'screen_size', {
          type: Sequelize.STRING(50),
          allowNull: true,
        });
      }
      if (!columns.language) {
        await queryInterface.addColumn('AnalyticsLogs', 'language', {
          type: Sequelize.STRING(20),
          allowNull: true,
        });
      }
    }
  },

  down: async (queryInterface) => {
    // Non-destructive rollback
  },
};
