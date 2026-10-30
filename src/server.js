const dotenv = require('dotenv');
dotenv.config();

const { validateEnv } = require('./config/envValidation');
validateEnv();

const app = require('./app');
const logger = require('./utils/logger');
const { createServer } = require('http');
const { initSocket } = require('./socket');
const { initAnalyticsWorker } = require('./workers/analyticsWorker');

const PORT = process.env.PORT || 3000;

// Catatan: migrasi database dijalankan manual (sequelize-cli), lihat AGENTS.md.

const startServer = async () => {
  try {
    const server = createServer(app);
    initSocket(server);
    initAnalyticsWorker();

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
