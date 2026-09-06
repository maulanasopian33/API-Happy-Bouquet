const cron = require('node-cron');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const db = require('../models');

// Fungsi untuk memindahkan data dari Redis ke Database SQL
const syncAnalyticsToDB = async () => {
  try {
    logger.info('🔄 Starting Analytics Sync to Database...');

    // Tarik semua data yang ada di list 'analytics:raw_logs'
    // Menggunakan RPOP (ambil dari paling lama) dalam loop hingga kosong
    let logEntry = await redis.rpop('analytics:raw_logs');
    let processed = 0;

    while (logEntry) {
      const data = JSON.parse(logEntry);

      await db.AnalyticsLog.create({
        session_id: data.session_id,
        url: data.url,
        referrer: data.referrer,
        event_type: data.event_type,
        scroll_depth: data.scroll_depth,
        ip_address: data.ip,
        user_agent: data.user_agent || data.uaString || 'Unknown',
        device_type: data.device_type,
        browser: data.browser,
        os: data.os,
        country: data.country,
        city: data.city,
        utm_source: data.utm?.source,
        utm_medium: data.utm?.medium,
        utm_campaign: data.utm?.campaign,
        timestamp: new Date(data.timestamp || Date.now())
      });

      processed++;
      logEntry = await redis.rpop('analytics:raw_logs');
    }

    logger.info(`✅ Analytics Sync Complete. Processed ${processed} entries.`);
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
  initAnalyticsWorker
};
