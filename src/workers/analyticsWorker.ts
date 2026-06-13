import cron from 'node-cron';
import redis from '../config/redis';
import logger from '../utils/logger';

// Fungsi untuk memindahkan data dari Redis ke Database SQL
export const syncAnalyticsToDB = async () => {
  try {
    logger.info('🔄 Starting Analytics Sync to Database...');
    
    // Tarik semua data yang ada di list 'analytics:raw_logs'
    // Menggunakan RPOP (ambil dari paling lama) dalam loop hingga kosong
    let logEntry = await redis.rpop('analytics:raw_logs');
    let processed = 0;

    while (logEntry) {
      const data = JSON.parse(logEntry);
      
      // TODO: Implementasi insert ke Sequelize Model (misalnya AnalyticsLog)
      // await AnalyticsLog.create({
      //   session_id: data.session_id,
      //   url: data.url,
      //   event_type: data.event_type,
      //   device_type: data.device_type,
      //   country: data.country,
      //   utm_source: data.utm.source,
      //   ...dll
      // });
      
      processed++;
      logEntry = await redis.rpop('analytics:raw_logs');
    }

    logger.info(`✅ Analytics Sync Complete. Processed ${processed} entries.`);
  } catch (error) {
    logger.error('❌ Error in Analytics Sync Worker:', error);
  }
};

// Setup cron job berjalan setiap 1 jam pada menit ke-0
export const initAnalyticsWorker = () => {
  cron.schedule('0 * * * *', () => {
    syncAnalyticsToDB();
  });
  logger.info('🕒 Analytics Worker initialized (Runs every hour).');
};
