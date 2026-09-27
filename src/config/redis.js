const Redis = require('ioredis');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

// Support both standard Redis URL and Upstash Redis URL
// Upstash format: rediss://default:password@host:port or redis://default:password@host:port
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

const isUpstash = REDIS_URL.includes('upstash.io') || REDIS_URL.startsWith('rediss://');

const redisOptions = {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  // Enable TLS for Upstash (rediss://) or when explicitly set
  tls: isUpstash ? {} : undefined,
  // Upstash specific: lazy connect to avoid immediate connection
  lazyConnect: isUpstash,
};

const redis = new Redis(REDIS_URL, redisOptions);

redis.on('connect', () => {
  logger.info('✅ Connected to Redis successfully');
});

redis.on('error', (err) => {
  logger.error('❌ Redis Connection Error:', err);
});

// For Upstash with lazyConnect, ensure connection on first use
if (isUpstash) {
  const originalGet = redis.get.bind(redis);
  redis.get = async function(key) {
    if (redis.status === 'wait') {
      await redis.connect();
    }
    return originalGet(key);
  };
}

module.exports = redis;
