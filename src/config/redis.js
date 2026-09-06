const Redis = require('ioredis');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

const redis = new Redis(REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('✅ Connected to Redis successfully');
});

redis.on('error', (err) => {
  logger.error('❌ Redis Connection Error:', err);
});

module.exports = redis;
