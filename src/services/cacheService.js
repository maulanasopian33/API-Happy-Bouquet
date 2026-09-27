const redis = require('../config/redis');
const logger = require('../utils/logger');

const cacheService = {
  async get(key) {
    try {
      const value = await redis.get(key);
      if (value === null) {
        return { value: null, ttl: -2 };
      }
      const ttl = await redis.ttl(key);
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }
      return { value: parsedValue, ttl };
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      throw error;
    }
  },

  async set(key, value, ttlSeconds) {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
      const ttl = await redis.ttl(key);
      return { key, ttl };
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
      throw error;
    }
  },

  async del(key) {
    try {
      const result = await redis.del(key);
      return { deleted: result === 1 };
    } catch (error) {
      logger.error(`Cache DEL error for key ${key}:`, error);
      throw error;
    }
  },

  async flushAll() {
    try {
      await redis.flushall();
      return { flushed: true };
    } catch (error) {
      logger.error('Cache FLUSHALL error:', error);
      throw error;
    }
  },

  async getKeys(pattern = '*', count = 100) {
    try {
      const keys = [];
      let cursor = '0';
      let totalScanned = 0;

      do {
        const [newCursor, foundKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
        cursor = newCursor;
        keys.push(...foundKeys);
        totalScanned += foundKeys.length;
        if (keys.length >= count) break;
      } while (cursor !== '0');

      return {
        keys: keys.slice(0, count),
        cursor: cursor === '0' ? 0 : parseInt(cursor, 10),
        count: keys.length,
        totalScanned
      };
    } catch (error) {
      logger.error(`Cache SCAN error for pattern ${pattern}:`, error);
      throw error;
    }
  },

  async getStats() {
    try {
      const info = await redis.info();
      const memory = await redis.info('memory');
      const clients = await redis.info('clients');
      const keyspace = await redis.info('keyspace');
      const server = await redis.info('server');

      const parseInfo = (infoStr) => {
        const result = {};
        infoStr.split('\r\n').forEach(line => {
          if (line && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            if (key && value !== undefined) {
              result[key] = value;
            }
          }
        });
        return result;
      };

      const memoryInfo = parseInfo(memory);
      const clientsInfo = parseInfo(clients);
      const keyspaceInfo = parseInfo(keyspace);
      const serverInfo = parseInfo(server);

      return {
        memory: {
          used: memoryInfo.used_memory_human || 'N/A',
          peak: memoryInfo.used_memory_peak_human || 'N/A',
          rss: memoryInfo.mem_rss_human || 'N/A'
        },
        clients: {
          connected: parseInt(clientsInfo.connected_clients || '0', 10),
          blocked: parseInt(clientsInfo.blocked_clients || '0', 10)
        },
        keyspace: keyspaceInfo,
        uptime: parseInt(serverInfo.uptime_in_seconds || '0', 10),
        version: serverInfo.redis_version || 'N/A'
      };
    } catch (error) {
      logger.error('Cache STATS error:', error);
      throw error;
    }
  },

  async getTTL(key) {
    try {
      const ttl = await redis.ttl(key);
      return { key, ttl };
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      throw error;
    }
  },

  async expire(key, ttlSeconds) {
    try {
      const result = await redis.expire(key, ttlSeconds);
      return { key, expired: result === 1, ttl: ttlSeconds };
    } catch (error) {
      logger.error(`Cache EXPIRE error for key ${key}:`, error);
      throw error;
    }
  },

  async pexpire(key, ttlMilliseconds) {
    try {
      const result = await redis.pexpire(key, ttlMilliseconds);
      return { key, expired: result === 1, ttlMs: ttlMilliseconds };
    } catch (error) {
      logger.error(`Cache PEXPIRE error for key ${key}:`, error);
      throw error;
    }
  },

  async exists(key) {
    try {
      const result = await redis.exists(key);
      return { key, exists: result === 1 };
    } catch (error) {
      logger.error(`Cache EXISTS error for key ${key}:`, error);
      throw error;
    }
  },

  async type(key) {
    try {
      const type = await redis.type(key);
      return { key, type };
    } catch (error) {
      logger.error(`Cache TYPE error for key ${key}:`, error);
      throw error;
    }
  }
};

module.exports = cacheService;