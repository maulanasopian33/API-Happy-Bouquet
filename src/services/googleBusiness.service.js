const { GoogleBusinessClient } = require('./google-business/googleBusinessClient');
const { GoogleAuthService } = require('./google-business/googleAuth.service');
const logger = require('../utils/logger');

// In-memory cache with TTL
const cache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 menit

function getCached(key, ttlMs = DEFAULT_TTL_MS) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttlMs) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// ─── Normalize location name: pastikan format v4 lengkap ───────
function v4LocationName(accountName, locationName) {
  if (locationName && locationName.startsWith('accounts/')) {
    return locationName;
  }
  return `${accountName}/${locationName}`;
}

function thumbnailUrl(url, size = 800) {
  if (!url) return '';
  const base = url.replace(/=(s\d+|w\d+-h\d+)([^/]*)$/, '');
  return base.replace(/=+$/, '') + `=s${size}`;
}

// ─── Google Business Profile Service ──────────────────────────

class GoogleBusinessService {
  // ─── ACCOUNTS & LOCATIONS ────────────────────────────────────
  static async listAccounts() {
    const cacheKey = 'gbp_accounts';
    const cached = getCached(cacheKey, 10 * 60 * 1000);
    if (cached) return cached;

    const data = await GoogleBusinessClient.get(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
    );

    if (data.error) return data;
    const accounts = data.accounts || [];
    setCache(cacheKey, { accounts });
    return { accounts };
  }

  static async listLocations(accountName) {
    const cacheKey = `gbp_locations_${accountName}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,regularHours,profile`;
    const data = await GoogleBusinessClient.get(url);

    if (data.error) return data;
    const locations = (data.locations || []).map(loc => ({
      ...loc,
      _account: accountName,
      _v4name: v4LocationName(accountName, loc.name),
    }));
    setCache(cacheKey, { locations });
    return { locations };
  }

  static async listAllLocations() {
    const accountsRes = await this.listAccounts();
    if (accountsRes.error) return accountsRes;

    const allLocations = [];
    for (const acc of (accountsRes.accounts || [])) {
      const locRes = await this.listLocations(acc.name);
      if (!locRes.error) {
        allLocations.push(...(locRes.locations || []));
      }
    }
    return { locations: allLocations };
  }

  static async getLocationDetail(locationName) {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,regularHours,profile`;
    return await GoogleBusinessClient.get(url);
  }

  static async updateLocation(locationName, payload) {
    invalidateCache('gbp_locations');
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?updateMask=title,phoneNumbers,websiteUri`;
    return await GoogleBusinessClient.patch(url, payload);
  }

  static async updateHours(locationName, periods) {
    invalidateCache('gbp_locations');
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?updateMask=regularHours`;
    return await GoogleBusinessClient.patch(url, {
      regularHours: { periods },
    });
  }

  // ─── REVIEWS ─────────────────────────────────────────────────
  static async listReviews(locationV4Name) {
    const cacheKey = `gbp_reviews_${locationV4Name}`;
    const cached = getCached(cacheKey, 3 * 60 * 1000);
    if (cached) return cached;

    const url = `https://mybusiness.googleapis.com/v4/${locationV4Name}/reviews`;
    const data = await GoogleBusinessClient.get(url);
    if (data.error) return data;
    setCache(cacheKey, data);
    return data;
  }

  static async replyReview(reviewName, comment) {
    invalidateCache('gbp_reviews');
    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
    return await GoogleBusinessClient.put(url, { comment });
  }

  static async deleteReply(reviewName) {
    invalidateCache('gbp_reviews');
    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
    return await GoogleBusinessClient.delete(url);
  }

  // ─── POSTS ───────────────────────────────────────────────────
  static async listPosts(locationV4Name) {
    const cacheKey = `gbp_posts_${locationV4Name}`;
    const cached = getCached(cacheKey, 3 * 60 * 1000);
    if (cached) return cached;

    const url = `https://mybusiness.googleapis.com/v4/${locationV4Name}/localPosts`;
    const data = await GoogleBusinessClient.get(url);
    if (data.error) return data;
    setCache(cacheKey, data);
    return data;
  }

  static async createPost(locationV4Name, { summary, ctaType, ctaUrl, languageCode = 'id' }) {
    invalidateCache('gbp_posts');
    const url = `https://mybusiness.googleapis.com/v4/${locationV4Name}/localPosts`;

    const payload = {
      languageCode,
      summary: summary.substring(0, 1500),
      topicType: 'STANDARD',
    };

    if (ctaUrl) {
      payload.callToAction = {
        actionType: ctaType || 'SHOP',
        url: ctaUrl,
      };
    }

    return await GoogleBusinessClient.post(url, payload);
  }

  static async deletePost(postName) {
    invalidateCache('gbp_posts');
    const url = `https://mybusiness.googleapis.com/v4/${postName}`;
    return await GoogleBusinessClient.delete(url);
  }

  // ─── MEDIA (PHOTOS) ─────────────────────────────────────────
  static async listMedia(locationV4Name) {
    const cacheKey = `gbp_media_${locationV4Name}`;
    const cached = getCached(cacheKey, 10 * 60 * 1000);
    if (cached) return cached;

    const url = `https://mybusiness.googleapis.com/v4/${locationV4Name}/media`;
    const data = await GoogleBusinessClient.get(url);
    if (data.error) return data;

    // Normalisasi URL foto ke thumbnail
    if (data.mediaItems) {
      data.mediaItems = data.mediaItems.map(item => ({
        ...item,
        thumbnailUrl: thumbnailUrl(item.googleUrl || item.sourceUrl || ''),
      }));
    }

    setCache(cacheKey, data);
    return data;
  }

  static async uploadPhoto(locationV4Name, { photoUrl, category = 'ADDITIONAL' }) {
    invalidateCache('gbp_media');
    const url = `https://mybusiness.googleapis.com/v4/${locationV4Name}/media`;
    return await GoogleBusinessClient.post(url, {
      mediaFormat: 'PHOTO',
      locationAssociation: { category },
      sourceUrl: photoUrl,
    });
  }

  static async deleteMedia(mediaName) {
    invalidateCache('gbp_media');
    const url = `https://mybusiness.googleapis.com/v4/${mediaName}`;
    return await GoogleBusinessClient.delete(url);
  }

  // ─── PERFORMANCE ─────────────────────────────────────────────
  static async fetchPerformance(locationName, days = 30) {
    const cacheKey = `gbp_perf_${locationName}_${days}`;
    const cached = getCached(cacheKey, 5 * 60 * 1000);
    if (cached) return cached;

    const metrics = [
      'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
      'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
      'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
      'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
      'CALL_CLICKS',
      'WEBSITE_CLICKS',
      'BUSINESS_DIRECTION_REQUESTS',
    ];

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const params = new URLSearchParams();
    metrics.forEach(m => params.append('dailyMetrics', m));
    params.append('dailyRange.startDate.year', startDate.getFullYear());
    params.append('dailyRange.startDate.month', startDate.getMonth() + 1);
    params.append('dailyRange.startDate.day', startDate.getDate());
    params.append('dailyRange.endDate.year', endDate.getFullYear());
    params.append('dailyRange.endDate.month', endDate.getMonth() + 1);
    params.append('dailyRange.endDate.day', endDate.getDate());

    const url = `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries?${params.toString()}`;
    const data = await GoogleBusinessClient.get(url);
    if (data.error) return data;
    setCache(cacheKey, data);
    return data;
  }

  // ─── CACHE MANAGEMENT ────────────────────────────────────────
  static clearCache(pattern) {
    invalidateCache(pattern || 'gbp_');
  }
}

module.exports = { GoogleBusinessService };
