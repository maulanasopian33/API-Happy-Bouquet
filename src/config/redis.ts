import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from '../utils/logger';

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
  console.log('✅ Connected to Redis successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

export default redis;
