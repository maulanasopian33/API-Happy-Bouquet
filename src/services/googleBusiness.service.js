const { GoogleBusinessClient } = require('./google-business/googleBusinessClient');
const { GoogleAuthService } = require('./google-business/googleAuth.service');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const mediaService = require('./mediaService');

const V4_BASE = 'https://mybusiness.googleapis.com/v4';
const MEDIA_PAGE_SIZE = 100;
const MEDIA_MAX_PAGES = 25; // 2.500 item; sisanya ditandai truncated
const MEDIA_CACHE_TTL_MS = 10 * 60 * 1000;
const MEDIA_ROOT = path.resolve(__dirname, '../../public/uploads/media');

// Enum resmi Google My Business Media API (v4).
const MEDIA_CATEGORIES = [
  'COVER', 'PROFILE', 'EXTERIOR', 'INTERIOR', 'PRODUCT', 'AT_WORK',
  'FOOD_AND_DRINK', 'MENU', 'COMMON_AREA', 'ROOMS', 'TEAMS', 'ADDITIONAL',
];


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

function normalizeMediaItem(item) {
  return {
    ...item,
    thumbnailUrl: item.thumbnailUrl || thumbnailUrl(item.googleUrl || item.sourceUrl || ''),
  };
}

function mediaTime(item) {
  const t = Date.parse(item.createTime || '');
  return Number.isFinite(t) ? t : 0;
}

function buildMediaSummary(items) {
  const byCategory = {};
  let owner = 0;
  let customer = 0;
  let totalViews = 0;

  for (const item of items) {
    const category = item.locationAssociation?.category || 'UNCATEGORIZED';
    byCategory[category] = (byCategory[category] || 0) + 1;
    if (item.attribution) customer++;
    else owner++;
    totalViews += Number(item.insights?.viewCount) || 0;
  }

  return { total: items.length, owner, customer, totalViews, byCategory };
}

function sortMedia(items, sort) {
  const byName = (a, b) => String(a.name).localeCompare(String(b.name));
  const sorted = [...items];

  switch (sort) {
    case 'oldest':
      // Tanggal tidak tersedia (mis. PROFILE) diletakkan di akhir.
      return sorted.sort((a, b) => (mediaTime(a) || Infinity) - (mediaTime(b) || Infinity) || byName(a, b));
    case 'views':
      return sorted.sort((a, b) => (Number(b.insights?.viewCount) || 0) - (Number(a.insights?.viewCount) || 0) || byName(a, b));
    case 'category':
      return sorted.sort((a, b) => {
        const catA = a.locationAssociation?.category || 'ZZZ';
        const catB = b.locationAssociation?.category || 'ZZZ';
        return catA.localeCompare(catB) || mediaTime(b) - mediaTime(a) || byName(a, b);
      });
    default:
      return sorted.sort((a, b) => mediaTime(b) - mediaTime(a) || byName(a, b));
  }
}

/**
 * Ubah path relatif Media Library menjadi path absolut yang dijamin
 * tetap berada di dalam public/uploads/media (cegah path traversal).
 */
function resolveMediaPath(mediaPath) {
  const absolute = path.resolve(__dirname, '../..', mediaPath || '');
  if (absolute !== MEDIA_ROOT && !absolute.startsWith(MEDIA_ROOT + path.sep)) {
    throw new Error('Path media tidak valid');
  }
  return absolute;
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

  static async createPost(locationV4Name, { summary, ctaType, ctaUrl, languageCode = 'id', mediaUrl, topicType = 'STANDARD' }) {
    invalidateCache('gbp_posts');
    const url = `https://mybusiness.googleapis.com/v4/${locationV4Name}/localPosts`;

    const payload = {
      languageCode,
      summary: summary.substring(0, 1500),
      topicType,
    };

    if (ctaUrl) {
      payload.callToAction = {
        actionType: ctaType || 'SHOP',
        url: ctaUrl,
      };
    }

    if (mediaUrl) {
      payload.media = [{
        mediaFormat: 'PHOTO',
        sourceUrl: mediaUrl,
      }];
    }

    return await GoogleBusinessClient.post(url, payload);
  }

  static async deletePost(postName) {
    invalidateCache('gbp_posts');
    const url = `https://mybusiness.googleapis.com/v4/${postName}`;
    return await GoogleBusinessClient.delete(url);
  }

  // ─── MEDIA (PHOTOS) ─────────────────────────────────────────
  /**
   * Ambil seluruh media lokasi (loop pageToken) lalu cache 10 menit.
   * Filter/paging dilakukan di atas data lengkap agar hasil konsisten.
   */
  static async fetchAllMedia(locationV4Name, { refresh = false } = {}) {
    const cacheKey = `gbp_media_all_${locationV4Name}`;
    if (!refresh) {
      const cached = getCached(cacheKey, MEDIA_CACHE_TTL_MS);
      if (cached) return cached;
    }

    const mediaItems = [];
    let pageToken = null;
    let truncated = false;

    for (let page = 0; page < MEDIA_MAX_PAGES; page++) {
      const params = new URLSearchParams({ pageSize: String(MEDIA_PAGE_SIZE) });
      if (pageToken) params.set('pageToken', pageToken);

      const data = await GoogleBusinessClient.get(`${V4_BASE}/${locationV4Name}/media?${params}`);
      if (data.error) return data;

      mediaItems.push(...(data.mediaItems || []));
      pageToken = data.nextPageToken || null;
      if (!pageToken) break;
      if (page === MEDIA_MAX_PAGES - 1) truncated = true;
    }

    const result = {
      mediaItems: mediaItems.map(normalizeMediaItem),
      truncated,
      fetchedAt: new Date().toISOString(),
    };
    setCache(cacheKey, result);
    return result;
  }

  static async listMedia(locationV4Name, options = {}) {
    const {
      page = 1,
      pageSize = 24,
      category,
      source,
      q,
      sort = 'newest',
      refresh = false,
    } = options;

    const raw = await this.fetchAllMedia(locationV4Name, { refresh });
    if (raw.error) return raw;

    const summary = buildMediaSummary(raw.mediaItems);
    let items = raw.mediaItems;

    if (category) {
      items = items.filter(item => item.locationAssociation?.category === category);
    }
    if (source === 'customer') {
      items = items.filter(item => Boolean(item.attribution));
    } else if (source === 'owner') {
      items = items.filter(item => !item.attribution);
    }
    if (q) {
      const needle = String(q).toLowerCase();
      items = items.filter(item => [
        item.description,
        item.name,
        item.attribution?.profileName,
      ].some(value => value && String(value).toLowerCase().includes(needle)));
    }

    items = sortMedia(items, sort);

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const start = (safePage - 1) * pageSize;

    return {
      mediaItems: items.slice(start, start + pageSize),
      pagination: { page: safePage, pageSize, total, totalPages },
      summary,
      truncated: raw.truncated,
      fetchedAt: raw.fetchedAt,
    };
  }

  static async getMedia(mediaName) {
    return await GoogleBusinessClient.get(`${V4_BASE}/${mediaName}`);
  }

  /**
   * Upload foto dari URL publik atau bytes (startUpload → upload → create).
   * dataRef dipakai agar Google tidak perlu mengambil file dari URL.
   */
  static async uploadPhoto(locationV4Name, { photoUrl, buffer, mimeType, category = 'ADDITIONAL', description } = {}) {
    if (!MEDIA_CATEGORIES.includes(category)) {
      throw new Error('Kategori foto tidak valid');
    }
    if (!photoUrl && !buffer) {
      throw new Error('Sumber foto wajib diisi');
    }

    const item = {
      mediaFormat: 'PHOTO',
      locationAssociation: { category },
    };

    const caption = typeof description === 'string' ? description.trim() : '';
    if (caption && category !== 'COVER') {
      item.description = caption.slice(0, 1000);
    }

    if (photoUrl) {
      item.sourceUrl = photoUrl;
    } else {
      const started = await GoogleBusinessClient.post(
        `${V4_BASE}/${locationV4Name}/media:startUpload`
      );
      if (started.error) return started;
      if (!started.resourceName) {
        return { error: { status: 502, message: 'Gagal memulai upload media ke Google' } };
      }

      const resourcePath = started.resourceName.split('/').map(encodeURIComponent).join('/');
      const uploaded = await GoogleBusinessClient.post(
        `https://mybusiness.googleapis.com/upload/v1/media/${resourcePath}?uploadType=media`,
        buffer,
        { headers: { 'Content-Type': mimeType || 'image/jpeg' } }
      );
      if (uploaded.error) return uploaded;

      item.dataRef = { resourceName: started.resourceName };
    }

    invalidateCache('gbp_media');
    return await GoogleBusinessClient.post(`${V4_BASE}/${locationV4Name}/media`, item);
  }

  /** Upload bytes dari file yang sudah ada di Media Library. */
  static async uploadPhotoFromMedia(locationV4Name, mediaId, options = {}) {
    const media = await mediaService.getMediaById(Number(mediaId));
    const filePath = resolveMediaPath(media.path);
    const buffer = fs.readFileSync(filePath);
    return await this.uploadPhoto(locationV4Name, { ...options, buffer, mimeType: media.mimeType });
  }

  /** Google hanya mengizinkan perubahan kategori, dan bukan ke COVER/PROFILE. */
  static async updateMediaCategory(mediaName, category) {
    if (!MEDIA_CATEGORIES.includes(category)) {
      throw new Error('Kategori foto tidak valid');
    }
    if (category === 'COVER' || category === 'PROFILE') {
      throw new Error('Kategori COVER/PROFILE tidak bisa diubah lewat sini');
    }

    invalidateCache('gbp_media');
    const url = `${V4_BASE}/${mediaName}?updateMask=locationAssociation.category`;
    return await GoogleBusinessClient.patch(url, { locationAssociation: { category } });
  }

  static async deleteMedia(mediaName) {
    invalidateCache('gbp_media');
    const url = `${V4_BASE}/${mediaName}`;
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

module.exports = { GoogleBusinessService, MEDIA_CATEGORIES, resolveMediaPath };
