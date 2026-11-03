const cacheService = require('../services/cacheService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const {
  setKeySchema,
  setExpirySchema,
  keyParamSchema,
  listKeysQuerySchema,
  sourceQuerySchema,
} = require('../validators/cacheValidator');

const handleValidationError = (error, res, next) => {
  if (error.name === 'ZodError') {
    return validationErrorResponse(res, error, 'Validation error', 400);
  }
  return next(error);
};

const getKeys = async (req, res, next) => {
  try {
    const { pattern, limit, source } = listKeysQuerySchema.parse(req.query);
    const result = await cacheService.getKeys(pattern, limit, source);
    logger.info(`Admin ${req.user?.id} listed cache keys (source=${source || cacheService.defaultSource}, pattern=${pattern})`);
    return successResponse(res, 'Daftar cache keys berhasil diambil', result);
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const getKey = async (req, res, next) => {
  try {
    const { params, source } = keyParamSchema.parse({ params: req.params, source: req.query.source });
    const result = await cacheService.get(params.key, source);
    if (result.value === null && result.ttl === -2) {
      return errorResponse(res, 'Cache key tidak ditemukan', 404, 'KEY_NOT_FOUND');
    }
    logger.info(`Admin ${req.user?.id} retrieved cache key: ${params.key}`);
    return successResponse(res, 'Cache key berhasil diambil', { key: params.key, ...result });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const setKey = async (req, res, next) => {
  try {
    const { key, value, ttl, source } = setKeySchema.parse(req.body);
    const result = await cacheService.set(key, value, ttl, source);
    logger.info(`Admin ${req.user?.id} set cache key: ${key} (source=${source || cacheService.defaultSource})`);
    return successResponse(res, 'Cache key berhasil disimpan', result);
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const deleteKey = async (req, res, next) => {
  try {
    const { params, source } = keyParamSchema.parse({ params: req.params, source: req.query.source });
    const result = await cacheService.del(params.key, source);
    if (!result.deleted) {
      return errorResponse(res, 'Cache key tidak ditemukan', 404, 'KEY_NOT_FOUND');
    }
    logger.info(`Admin ${req.user?.id} deleted cache key: ${params.key}`);
    return successResponse(res, 'Cache key berhasil dihapus', result);
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const flushCache = async (req, res, next) => {
  try {
    const { source } = sourceQuerySchema.parse({ source: req.query.source });
    const result = await cacheService.flushAll(source);
    logger.warn(`Admin ${req.user?.id} FLUSHED ALL CACHE (source=${source || cacheService.defaultSource})`);
    return successResponse(res, 'Semua cache berhasil dihapus (FLUSHALL)', result);
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const getStats = async (req, res, next) => {
  try {
    const { source } = sourceQuerySchema.parse({ source: req.query.source });
    const stats = await cacheService.getStats(source);
    return successResponse(res, 'Statistik Redis berhasil diambil', {
      ...stats,
      source: source || cacheService.defaultSource,
      upstashConfigured: cacheService.isUpstashConfigured,
    });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const getKeyTTL = async (req, res, next) => {
  try {
    const { params, source } = keyParamSchema.parse({ params: req.params, source: req.query.source });
    const result = await cacheService.getTTL(params.key, source);
    if (result.ttl === -2) {
      return errorResponse(res, 'Cache key tidak ditemukan', 404, 'KEY_NOT_FOUND');
    }
    return successResponse(res, 'TTL cache key berhasil diambil', result);
  } catch (error) {
    return handleValidationError(error, res, next);
  }
};

const setKeyExpiry = async (req, res, next) => {
  try {
    const { params, body } = setExpirySchema.parse({ params: req.params, body: req.body });
    const result = body.ttlMs
      ? await cacheService.pexpire(params.key, body.ttlMs, body.source)
      : await cacheService.expire(params.key, body.ttl, body.source);

    if (!result.expired) {
      return errorResponse(res, 'Cache key tidak ditemukan atau gagal set expiry', 404, 'KEY_NOT_FOUND');
    }
    logger.info(`Admin ${req.user?.id} set expiry for key: ${params.key}`);
    return successResponse(res, 'Expiry cache key berhasil diatur', result);
  } catch (error) {
    return handleValidationError(error, res, next);
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
  setKeyExpiry,
};
