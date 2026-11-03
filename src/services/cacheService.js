const localRedis = require('../config/redis');
const upstash = require('../config/upstash');
const logger = require('../utils/logger');

// Upstash dipakai Nuxt (prefix happybouquet:cache:); local dipakai analytics backend.
const DEFAULT_SOURCE = upstash.isConfigured ? 'upstash' : 'local';

const resolveSource = (source) => {
  if (source === 'local' || source === 'upstash') return source;
  return DEFAULT_SOURCE;
};

const parseValue = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parseInfo = (infoStr) => {
  const result = {};
  String(infoStr || '').split('\r\n').forEach((line) => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':');
      if (key && value !== undefined) result[key] = value;
    }
  });
  return result;
};

const scanAll = async (scanFn, pattern, count) => {
  const keys = [];
  let cursor = 0;
  let totalScanned = 0;
  let guard = 0;

  do {
    const [nextCursor, foundKeys] = await scanFn(cursor, pattern, count);
    cursor = nextCursor;
    keys.push(...foundKeys);
    totalScanned += foundKeys.length;
    guard += 1;
  } while (cursor !== 0 && keys.length < count && guard < 50);

  return {
    keys: keys.slice(0, count),
    cursor: cursor === '0' ? 0 : Number(cursor) || 0,
    count: Math.min(keys.length, count),
    totalScanned,
  };
};

const buildStats = (infoStr) => {
  const info = parseInfo(infoStr);
  return {
    memory: {
      used: info.used_memory_human || 'N/A',
      peak: info.used_memory_peak_human || 'N/A',
      rss: info.mem_rss_human || 'N/A',
    },
    clients: {
      connected: parseInt(info.connected_clients || '0', 10),
      blocked: parseInt(info.blocked_clients || '0', 10),
    },
    keyspace: {},
    uptime: parseInt(info.uptime_in_seconds || '0', 10),
    version: info.redis_version || 'N/A',
  };
};

const localAdapter = {
  async get(key) {
    const value = await localRedis.get(key);
    const ttl = await localRedis.ttl(key);
    return { value: value === null ? null : parseValue(value), ttl };
  },

  async set(key, value, ttlSeconds) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await localRedis.setex(key, ttlSeconds, serialized);
    } else {
      await localRedis.set(key, serialized);
    }
    return { key, ttl: await localRedis.ttl(key) };
  },

  async del(key) {
    const result = await localRedis.del(key);
    return { deleted: result === 1 };
  },

  async flushAll() {
    await localRedis.flushall();
    return { flushed: true };
  },

  async scan(pattern, count) {
    return scanAll(
      async (cursor, match, limit) => {
        const [next, found] = await localRedis.scan(String(cursor), 'MATCH', match, 'COUNT', limit);
        return [Number(next), found];
      },
      pattern,
      count
    );
  },

  async stats() {
    const sections = await Promise.all([
      localRedis.info(),
      localRedis.info('memory'),
      localRedis.info('clients'),
      localRedis.info('keyspace'),
    ]);
    const stats = buildStats([sections[0], sections[1], sections[2], sections[3]].join('\r\n'));
    stats.keyspace = parseInfo(sections[3]);
    return stats;
  },

  async ttl(key) {
    return localRedis.ttl(key);
  },

  async expire(key, ttlSeconds) {
    return localRedis.expire(key, ttlSeconds);
  },

  async pexpire(key, ttlMs) {
    return localRedis.pexpire(key, ttlMs);
  },
};

const upstashAdapter = {
  async get(key) {
    const value = await upstash.command('GET', key);
    const ttl = await upstash.command('TTL', key);
    return { value: value === null ? null : parseValue(value), ttl };
  },

  async set(key, value, ttlSeconds) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await upstash.command('SET', key, serialized, 'EX', ttlSeconds);
    } else {
      await upstash.command('SET', key, serialized);
    }
    return { key, ttl: await upstash.command('TTL', key) };
  },

  async del(key) {
    const result = await upstash.command('DEL', key);
    return { deleted: Number(result) === 1 };
  },

  async flushAll() {
    await upstash.command('FLUSHALL');
    return { flushed: true };
  },

  async scan(pattern, count) {
    return scanAll(
      async (cursor, match, limit) => {
        const result = await upstash.command('SCAN', cursor, 'MATCH', match, 'COUNT', limit);
        const [next, found] = result;
        return [Number(next), found || []];
      },
      pattern,
      count
    );
  },

  async stats() {
    const infoStr = await upstash.command('INFO');
    const stats = buildStats(infoStr);
    const keyspace = {};
    String(infoStr || '')
      .split('\r\n')
      .filter((line) => /^db\d+:/.test(line))
      .forEach((line) => {
        const [db, detail] = line.split(':');
        const parsed = {};
        detail.split(',').forEach((part) => {
          const [k, v] = part.split('=');
          if (k) parsed[k] = parseInt(v, 10);
        });
        keyspace[db] = parsed;
      });
    stats.keyspace = keyspace;
    return stats;
  },

  async ttl(key) {
    return upstash.command('TTL', key);
  },

  async expire(key, ttlSeconds) {
    return upstash.command('EXPIRE', key, ttlSeconds);
  },

  async pexpire(key, ttlMs) {
    return upstash.command('PEXPIRE', key, ttlMs);
  },
};

const adapters = { local: localAdapter, upstash: upstashAdapter };
const adapterFor = (source) => adapters[resolveSource(source)];

const cacheService = {
  isUpstashConfigured: upstash.isConfigured,
  defaultSource: DEFAULT_SOURCE,

  async get(key, source) {
    try {
      return await adapterFor(source).get(key);
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      throw error;
    }
  },

  async set(key, value, ttlSeconds, source) {
    try {
      return await adapterFor(source).set(key, value, ttlSeconds);
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
      throw error;
    }
  },

  async del(key, source) {
    try {
      return await adapterFor(source).del(key);
    } catch (error) {
      logger.error(`Cache DEL error for key ${key}:`, error);
      throw error;
    }
  },

  async flushAll(source) {
    try {
      return await adapterFor(source).flushAll();
    } catch (error) {
      logger.error('Cache FLUSHALL error:', error);
      throw error;
    }
  },

  async getKeys(pattern = '*', count = 100, source) {
    try {
      return await adapterFor(source).scan(pattern, count);
    } catch (error) {
      logger.error(`Cache SCAN error for pattern ${pattern}:`, error);
      throw error;
    }
  },

  async getStats(source) {
    try {
      return await adapterFor(source).stats();
    } catch (error) {
      logger.error('Cache STATS error:', error);
      throw error;
    }
  },

  async getTTL(key, source) {
    try {
      return { key, ttl: await adapterFor(source).ttl(key) };
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      throw error;
    }
  },

  async expire(key, ttlSeconds, source) {
    try {
      const result = await adapterFor(source).expire(key, ttlSeconds);
      return { key, expired: Number(result) === 1, ttl: ttlSeconds };
    } catch (error) {
      logger.error(`Cache EXPIRE error for key ${key}:`, error);
      throw error;
    }
  },

  async pexpire(key, ttlMilliseconds, source) {
    try {
      const result = await adapterFor(source).pexpire(key, ttlMilliseconds);
      return { key, expired: Number(result) === 1, ttlMs: ttlMilliseconds };
    } catch (error) {
      logger.error(`Cache PEXPIRE error for key ${key}:`, error);
      throw error;
    }
  },
};

module.exports = cacheService;
