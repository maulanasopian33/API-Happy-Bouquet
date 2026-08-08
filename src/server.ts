import app from './app';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { createServer } from 'http';
import { initSocket } from './socket';
import { initAnalyticsWorker } from './workers/analyticsWorker';

dotenv.config();

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
