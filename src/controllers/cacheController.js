const cacheService = require('../services/cacheService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const {
  setKeySchema,
  setExpirySchema,
  keyParamSchema,
  listKeysQuerySchema
} = require('../validators/cacheValidator');

const getKeys = async (req, res, next) => {
  try {
    const validated = listKeysQuerySchema.parse(req.query);
    const { pattern = '*', limit = 100 } = validated.query;
    const parsedLimit = Math.min(parseInt(limit, 10), 1000);
    const result = await cacheService.getKeys(pattern, parsedLimit);
    logger.info(`Admin ${req.user?.id} listed cache keys with pattern: ${pattern}`);
    return successResponse(res, 'Daftar cache keys berhasil diambil', result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    next(error);
  }
};

const getKey = async (req, res, next) => {
  try {
    const validated = keyParamSchema.parse(req.params);
    const { key } = validated.params;
    const result = await cacheService.get(key);
    if (result.value === null && result.ttl === -2) {
      return errorResponse(res, 'Cache key tidak ditemukan', 404, 'KEY_NOT_FOUND');
    }
    logger.info(`Admin ${req.user?.id} retrieved cache key: ${key}`);
    return successResponse(res, 'Cache key berhasil diambil', { key, ...result });
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    next(error);
  }
};

const setKey = async (req, res, next) => {
  try {
    const validated = setKeySchema.parse(req.body);
    const { key, value, ttl } = validated.body;
    const ttlSeconds = ttl ? parseInt(ttl, 10) : undefined;
    const result = await cacheService.set(key, value, ttlSeconds);
    logger.info(`Admin ${req.user?.id} set cache key: ${key} with TTL: ${ttlSeconds || 'none'}`);
    return successResponse(res, 'Cache key berhasil disimpan', result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    next(error);
  }
};

const deleteKey = async (req, res, next) => {
  try {
    const validated = keyParamSchema.parse(req.params);
    const { key } = validated.params;
    const result = await cacheService.del(key);
    if (!result.deleted) {
      return errorResponse(res, 'Cache key tidak ditemukan', 404, 'KEY_NOT_FOUND');
    }
    logger.info(`Admin ${req.user?.id} deleted cache key: ${key}`);
    return successResponse(res, 'Cache key berhasil dihapus', result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    next(error);
  }
};

const flushCache = async (req, res, next) => {
  try {
    const result = await cacheService.flushAll();
    logger.warn(`Admin ${req.user?.id} FLUSHED ALL CACHE`);
    return successResponse(res, 'Semua cache berhasil dihapus (FLUSHALL)', result);
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await cacheService.getStats();
    logger.info(`Admin ${req.user?.id} retrieved Redis stats`);
    return successResponse(res, 'Statistik Redis berhasil diambil', stats);
  } catch (error) {
    next(error);
  }
};

const getKeyTTL = async (req, res, next) => {
  try {
    const validated = keyParamSchema.parse(req.params);
    const { key } = validated.params;
    const result = await cacheService.getTTL(key);
    if (result.ttl === -2) {
      return errorResponse(res, 'Cache key tidak ditemukan', 404, 'KEY_NOT_FOUND');
    }
    logger.info(`Admin ${req.user?.id} retrieved TTL for key: ${key}`);
    return successResponse(res, 'TTL cache key berhasil diambil', result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    next(error);
  }
};

const setKeyExpiry = async (req, res, next) => {
  try {
    const validated = setExpirySchema.parse({ params: req.params, body: req.body });
    const { key } = validated.params;
    const { ttl, ttlMs } = validated.body;
    let result;
    if (ttlMs) {
      result = await cacheService.pexpire(key, parseInt(ttlMs, 10));
    } else if (ttl) {
      result = await cacheService.expire(key, parseInt(ttl, 10));
    }
    if (!result.expired) {
      return errorResponse(res, 'Cache key tidak ditemukan atau gagal set expiry', 404, 'KEY_NOT_FOUND');
    }
    logger.info(`Admin ${req.user?.id} set expiry for key: ${key}`);
    return successResponse(res, 'Expiry cache key berhasil diatur', result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    next(error);
  }
};

module.exports = {
  getKeys,
  getKey,
  setKey,
  deleteKey,
  flushCache,
  getStats,
  getKeyTTL,
  setKeyExpiry
};