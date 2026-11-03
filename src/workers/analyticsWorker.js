const cron = require('node-cron');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const db = require('../models');

// Fungsi untuk memindahkan data dari Redis ke Database SQL
const syncAnalyticsToDB = async () => {
  try {
    logger.info('🔄 Starting Analytics Sync to Database...');

    // Tarik semua data yang ada di list 'analytics:raw_logs' (pengunjung asli)
    // dan 'analytics:bot_raw_logs' (lalu lintas bot)
    let processed = 0;

    // 1. Proses log pengunjung asli
    let logEntry = await redis.rpop('analytics:raw_logs');
    while (logEntry) {
      try {
        const data = JSON.parse(logEntry);

        await db.AnalyticsLog.create({
          session_id: data.session_id,
          url: data.url,
          referrer: data.referrer,
          event_type: data.event_type || 'pageview',
          event_name: data.event_name || null,
          event_data: typeof data.event_data === 'object' ? JSON.stringify(data.event_data) : data.event_data || null,
          scroll_depth: data.scroll_depth || null,
          duration_seconds: data.duration_seconds || null,
          screen_size: data.screen_size || null,
          language: data.language || null,
          ip_address: data.ip || '127.0.0.1',
          user_agent: data.user_agent || data.uaString || 'Unknown',
          device_type: data.device_type || 'desktop',
          browser: data.browser || 'Unknown',
          os: data.os || 'Unknown',
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
          utm_source: data.utm?.source || null,
          utm_medium: data.utm?.medium || null,
          utm_campaign: data.utm?.campaign || null,
          is_bot: false,
          bot_name: null,
          bot_category: null,
          threat_level: null,
          timestamp: new Date(data.timestamp || Date.now()),
        });
        processed++;
      } catch (err) {
        logger.warn('Gagal memproses satu item raw_logs analytics:', err.message);
      }
      logEntry = await redis.rpop('analytics:raw_logs');
    }

    // 2. Proses log bot / crawler
    let botEntry = await redis.rpop('analytics:bot_raw_logs');
    while (botEntry) {
      try {
        const data = JSON.parse(botEntry);

        await db.AnalyticsLog.create({
          session_id: data.session_id || 'bot_sess',
          url: data.url,
          referrer: data.referrer,
          event_type: data.event_type || 'bot_crawl',
          event_name: data.event_name || 'crawl',
          event_data: typeof data.event_data === 'object' ? JSON.stringify(data.event_data) : data.event_data || null,
          scroll_depth: null,
          duration_seconds: null,
          screen_size: null,
          language: null,
          ip_address: data.ip || '127.0.0.1',
          user_agent: data.user_agent || data.uaString || 'Unknown',
          device_type: data.device_type || 'bot',
          browser: data.browser || 'Bot',
          os: data.os || 'Unknown',
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
          utm_source: data.utm?.source || null,
          utm_medium: data.utm?.medium || null,
          utm_campaign: data.utm?.campaign || null,
          is_bot: true,
          bot_name: data.bot_name || 'Unknown Bot',
          bot_category: data.bot_category || 'scraper_cli',
          threat_level: data.threat_level || 'low',
          timestamp: new Date(data.timestamp || Date.now()),
        });
        processed++;
      } catch (err) {
        logger.warn('Gagal memproses satu item bot_raw_logs analytics:', err.message);
      }
      botEntry = await redis.rpop('analytics:bot_raw_logs');
    }

    logger.info(`✅ Analytics Sync Complete. Processed ${processed} total entries.`);
  } catch (error) {
    logger.error('❌ Error in Analytics Sync Worker:', error);
  }
};

// Setup cron job berjalan setiap 1 jam pada menit ke-0
const initAnalyticsWorker = () => {
  cron.schedule('0 * * * *', () => {
    syncAnalyticsToDB();
  });
  logger.info('🕒 Analytics Worker initialized (Runs every hour).');
};

module.exports = {
  syncAnalyticsToDB,
  initAnalyticsWorker,
};
