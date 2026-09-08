const logger = require('../../utils/logger');

/**
 * Google API Quota Tracker
 * Melacak jumlah pemanggilan API per hari per endpoint.
 * Reset otomatis saat tanggal berganti.
 */

// Known daily quotas per Google Business Profile API endpoints
// Source: Google Cloud Console default quotas
const KNOWN_QUOTAS = {
  'mybusinessaccountmanagement.googleapis.com': { daily: 1000, perMinute: 60, label: 'Account Management' },
  'mybusinessbusinessinformation.googleapis.com': { daily: 1000, perMinute: 60, label: 'Business Information' },
  'mybusiness.googleapis.com': { daily: 1000, perMinute: 60, label: 'My Business (Reviews/Posts/Media)' },
  'businessprofileperformance.googleapis.com': { daily: 1000, perMinute: 60, label: 'Performance Insights' },
  'oauth2.googleapis.com': { daily: 5000, perMinute: 300, label: 'OAuth Token' },
};

// In-memory store: { date: string, calls: { [apiName]: { total, byEndpoint: { [endpoint]: count } } } }
let quotaStore = {
  date: getToday(),
  calls: {},
  errors: 0,
  rateLimited: 0,
};

function getToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function ensureToday() {
  const today = getToday();
  if (quotaStore.date !== today) {
    logger.info(`[Quota] Reset quota tracker for new day: ${today}`);
    quotaStore = { date: today, calls: {}, errors: 0, rateLimited: 0 };
  }
}

/**
 * Ekstrak nama API dari URL Google
 * Contoh: "https://mybusiness.googleapis.com/v4/..." → "mybusiness.googleapis.com"
 */
function extractApiName(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Ekstrak endpoint path dari URL
 * Contoh: ".../v4/accounts/123/locations/456/reviews" → "accounts/{id}/locations/{id}/reviews"
 */
function extractEndpoint(url) {
  try {
    const u = new URL(url);
    let path = u.pathname;
    // Normalisasi: ganti ID numerik dengan {id}
    path = path.replace(/\/\d+/g, '/{id}');
    // Hapus prefix versi API
    path = path.replace(/^\/v\d+/, '');
    // Hapus trailing slash
    path = path.replace(/\/+$/, '') || '/';
    return path;
  } catch {
    return url;
  }
}

/**
 * Catat satu pemanggilan API
 */
function trackCall(url, method = 'GET', statusCode = 200) {
  ensureToday();

  const apiName = extractApiName(url);
  const endpoint = extractEndpoint(url);
  const key = `${method} ${endpoint}`;

  if (!quotaStore.calls[apiName]) {
    quotaStore.calls[apiName] = { total: 0, byEndpoint: {}, byMethod: {} };
  }

  const api = quotaStore.calls[apiName];
  api.total++;

  if (!api.byEndpoint[key]) {
    api.byEndpoint[key] = 0;
  }
  api.byEndpoint[key]++;

  if (!api.byMethod[method]) {
    api.byMethod[method] = 0;
  }
  api.byMethod[method]++;

  if (statusCode === 429) {
    quotaStore.rateLimited++;
  }
  if (statusCode >= 400) {
    quotaStore.errors++;
  }
}

/**
 * Ambil status quota saat ini
 */
function getQuotaStatus() {
  ensureToday();

  const result = {
    date: quotaStore.date,
    timestamp: new Date().toISOString(),
    totalCalls: 0,
    totalErrors: quotaStore.errors,
    totalRateLimited: quotaStore.rateLimited,
    apis: [],
  };

  for (const [apiName, data] of Object.entries(quotaStore.calls)) {
    const known = KNOWN_QUOTAS[apiName] || { daily: 1000, perMinute: 60, label: apiName };
    const remaining = Math.max(0, known.daily - data.total);
    const usagePercent = Math.round((data.total / known.daily) * 100);

    const endpoints = Object.entries(data.byEndpoint).map(([ep, count]) => ({
      endpoint: ep,
      calls: count,
      percent: Math.round((count / known.daily) * 100),
    })).sort((a, b) => b.calls - a.calls);

    result.apis.push({
      apiName,
      label: known.label,
      used: data.total,
      limit: known.daily,
      remaining,
      usagePercent,
      perMinuteLimit: known.perMinute,
      byMethod: data.byMethod,
      topEndpoints: endpoints.slice(0, 10), // top 10 endpoints
    });

    result.totalCalls += data.total;
  }

  // Tambah API yang belum dipakai tapi ada di known quotas
  for (const [apiName, known] of Object.entries(KNOWN_QUOTAS)) {
    if (!result.apis.find(a => a.apiName === apiName)) {
      result.apis.push({
        apiName,
        label: known.label,
        used: 0,
        limit: known.daily,
        remaining: known.daily,
        usagePercent: 0,
        perMinuteLimit: known.perMinute,
        byMethod: {},
        topEndpoints: [],
      });
    }
  }

  return result;
}

/**
 * Reset quota tracker (manual)
 */
function resetQuota() {
  quotaStore = { date: getToday(), calls: {}, errors: 0, rateLimited: 0 };
  logger.info('[Quota] Quota tracker manually reset');
}

module.exports = { trackCall, getQuotaStatus, resetQuota, KNOWN_QUOTAS };
