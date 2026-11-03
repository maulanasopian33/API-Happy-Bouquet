const redis = require('../config/redis');
const { parseVisitorData } = require('../utils/analyticsHelper');
const logger = require('../utils/logger');
const db = require('../models');
const { Op } = require('sequelize');

/**
 * Endpoint publik penerima telemetri analytics dari frontend storefront
 * Mendukung pemisahan Real Human Visitors vs Bot Traffic
 */
const collectAnalytics = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.session_id || !payload.url) {
      res.status(400).json({ error: 'session_id and url are required' });
      return;
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const uaString = req.headers['user-agent'] || '';

    // Deteksi bot dan parsing informasi pengunjung
    const visitorData = parseVisitorData(ip, uaString, payload.url, payload);
    const now = Date.now();

    // Skenario Exit / Tab Unload
    if (payload.event_type === 'exit') {
      if (visitorData.is_bot) {
        await redis.zrem('analytics:bot_active', payload.session_id);
      } else {
        await redis.zrem('analytics:active_visitors', payload.session_id);
      }
      res.status(200).send('OK');
      return;
    }

    const logEntryObj = {
      session_id: payload.session_id,
      url: payload.url,
      referrer: payload.referrer || '',
      event_type: payload.event_type || 'pageview',
      event_name: payload.event_name || null,
      event_data: payload.event_data || null,
      scroll_depth: payload.scroll_depth || null,
      duration_seconds: payload.duration_seconds || null,
      screen_size: payload.screen_size || null,
      language: payload.language || null,
      ip,
      user_agent: uaString,
      device_type: visitorData.device_type,
      browser: visitorData.browser,
      os: visitorData.os,
      country: visitorData.country,
      city: visitorData.city,
      utm: visitorData.utm,
      is_bot: visitorData.is_bot,
      bot_name: visitorData.bot_name,
      bot_category: visitorData.bot_category,
      threat_level: visitorData.threat_level,
      timestamp: now,
    };
    const logEntryStr = JSON.stringify(logEntryObj);

    if (!visitorData.is_bot) {
      // ─── 1. PENGUNJUNG MANUSIA ASLI (REAL VISITOR) ─────────────────
      // Update active human visitors (sliding window expire)
      await redis.zadd('analytics:active_visitors', now, payload.session_id);

      if (payload.event_type === 'pageview') {
        await redis.zincrby('analytics:top_urls', 1, payload.url);
      } else if (payload.event_type === 'action' || payload.event_type === 'custom_event') {
        const actionKey = payload.event_name || 'custom_action';
        await redis.zincrby('analytics:real_actions', 1, actionKey);
      }

      // Simpan ke antrean sinkronisasi database
      await redis.lpush('analytics:raw_logs', logEntryStr);

      // Simpan stream 30 aktivitas terkini untuk panel admin live feed
      await redis.lpush('analytics:recent_visitors', logEntryStr);
      await redis.ltrim('analytics:recent_visitors', 0, 29);

    } else {
      // ─── 2. LALU LINTAS BOT / CRAWLER (SEPARATED TRAFFIC) ──────────
      // Catat terpisah agar data pengunjung manusia tidak terdistorsi/bias
      await redis.zadd('analytics:bot_active', now, payload.session_id);
      await redis.zincrby('analytics:bot_urls', 1, payload.url);
      if (visitorData.bot_name) {
        await redis.zincrby('analytics:bot_names', 1, visitorData.bot_name);
      }
      if (visitorData.bot_category) {
        await redis.zincrby('analytics:bot_categories', 1, visitorData.bot_category);
      }

      // Simpan ke antrean sinkronisasi database bot
      await redis.lpush('analytics:bot_raw_logs', logEntryStr);

      // Simpan stream 30 bot hits terkini untuk tab bot intelligence
      await redis.lpush('analytics:recent_bots', logEntryStr);
      await redis.ltrim('analytics:recent_bots', 0, 29);
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Analytics collect error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Ringkasan metrik analitik untuk Dashboard Admin (Overview)
 * Membandingkan Real Visitors vs Bot Traffic
 */
const getAnalyticsOverview = async (req, res) => {
  try {
    const ACTIVE_WINDOW_MS = 60 * 1000; // 1 menit
    const cutoff = Date.now() - ACTIVE_WINDOW_MS;

    // 1. Data Realtime dari Redis
    const [
      activeRealCount,
      activeBotCount,
      topUrlsRaw,
      topBotUrlsRaw,
      botNamesRaw,
      botCategoriesRaw,
      realActionsRaw,
      recentVisitorsRaw,
      recentBotsRaw,
    ] = await Promise.all([
      redis.zcount('analytics:active_visitors', cutoff, '+inf').catch(() => 0),
      redis.zcount('analytics:bot_active', cutoff, '+inf').catch(() => 0),
      redis.zrevrange('analytics:top_urls', 0, 7, 'WITHSCORES').catch(() => []),
      redis.zrevrange('analytics:bot_urls', 0, 7, 'WITHSCORES').catch(() => []),
      redis.zrevrange('analytics:bot_names', 0, 5, 'WITHSCORES').catch(() => []),
      redis.zrevrange('analytics:bot_categories', 0, 5, 'WITHSCORES').catch(() => []),
      redis.zrevrange('analytics:real_actions', 0, 7, 'WITHSCORES').catch(() => []),
      redis.lrange('analytics:recent_visitors', 0, 9).catch(() => []),
      redis.lrange('analytics:recent_bots', 0, 9).catch(() => []),
    ]);

    // Parse zrevrange withscores
    const formatScores = (arr) => {
      const result = [];
      for (let i = 0; i + 1 < arr.length; i += 2) {
        result.push({ name: String(arr[i]), count: Number(arr[i + 1]) });
      }
      return result;
    };

    const topPages = formatScores(topUrlsRaw).map((i) => ({ url: i.name, views: i.count }));
    const topBotTargets = formatScores(topBotUrlsRaw).map((i) => ({ url: i.name, count: i.count }));
    const topBotNames = formatScores(botNamesRaw);
    const topBotCategories = formatScores(botCategoriesRaw);
    const topActions = formatScores(realActionsRaw);

    // Parse recent feeds
    const parseFeed = (list) => {
      return list.map((item) => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }).filter(Boolean);
    };

    const recentVisitors = parseFeed(recentVisitorsRaw);
    const recentBots = parseFeed(recentBotsRaw);

    // 2. Data Agregasi Database Hari Ini (atau fallback jika belum tersinkron)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let dbRealCount = 0;
    let dbBotCount = 0;

    try {
      if (db.AnalyticsLog) {
        dbRealCount = await db.AnalyticsLog.count({
          where: {
            is_bot: false,
            timestamp: { [Op.gte]: startOfToday },
          },
        });
        dbBotCount = await db.AnalyticsLog.count({
          where: {
            is_bot: true,
            timestamp: { [Op.gte]: startOfToday },
          },
        });
      }
    } catch {
      // Abaikan jika tabel belum termigrasi di env tertentu
    }

    res.status(200).json({
      status: true,
      message: 'Berhasil memuat ringkasan analitik.',
      data: {
        real_visitors: {
          active_now: activeRealCount || 0,
          total_today: Math.max(dbRealCount, topPages.reduce((acc, p) => acc + p.views, 0)),
          top_pages: topPages,
          top_actions: topActions,
          recent_feed: recentVisitors,
        },
        bot_intelligence: {
          active_now: activeBotCount || 0,
          total_today: Math.max(dbBotCount, topBotTargets.reduce((acc, b) => acc + b.count, 0)),
          top_targets: topBotTargets,
          top_bot_names: topBotNames,
          top_categories: topBotCategories,
          recent_feed: recentBots,
        },
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('getAnalyticsOverview error:', error);
    res.status(500).json({ status: false, message: 'Gagal memuat analitik', error: error.message });
  }
};

/**
 * Log histori aktivitas pengunjung manusia asli
 */
const getVisitorLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let rows = [];
    let total = 0;

    if (db.AnalyticsLog) {
      const resDb = await db.AnalyticsLog.findAndCountAll({
        where: { is_bot: false },
        order: [['timestamp', 'DESC']],
        limit,
        offset,
      });
      rows = resDb.rows;
      total = resDb.count;
    }

    // Jika DB kosong (data baru di Redis), fallback ambil dari stream Redis
    if (rows.length === 0) {
      const recent = await redis.lrange('analytics:recent_visitors', 0, limit - 1).catch(() => []);
      rows = recent.map((item) => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }).filter(Boolean);
      total = rows.length;
    }

    res.status(200).json({
      status: true,
      message: 'Berhasil memuat log pengunjung manusia.',
      data: {
        logs: rows,
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (error) {
    logger.error('getVisitorLogs error:', error);
    res.status(500).json({ status: false, message: 'Gagal memuat log pengunjung', error: error.message });
  }
};

/**
 * Log deteksi bot, crawler, dan scanner dengan rekomendasi tindakan
 */
const getBotLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let rows = [];
    let total = 0;

    if (db.AnalyticsLog) {
      const resDb = await db.AnalyticsLog.findAndCountAll({
        where: { is_bot: true },
        order: [['timestamp', 'DESC']],
        limit,
        offset,
      });
      rows = resDb.rows;
      total = resDb.count;
    }

    // Jika DB kosong, fallback ambil dari stream Redis
    if (rows.length === 0) {
      const recent = await redis.lrange('analytics:recent_bots', 0, limit - 1).catch(() => []);
      rows = recent.map((item) => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }).filter(Boolean);
      total = rows.length;
    }

    // Berikan panduan tindakan otomatis berdasarkan ancaman bot
    const enrichedLogs = rows.map((bot) => {
      const plain = bot.toJSON ? bot.toJSON() : bot;
      let actionRecommendation = 'Biarkan (Crawler wajar untuk index / preview)';

      if (plain.threat_level === 'high') {
        actionRecommendation = 'BAHAYA: Scanner keamanan terdeteksi. Pertimbangkan blokir IP ini di firewall / Cloudflare.';
      } else if (plain.threat_level === 'medium') {
        actionRecommendation = 'PERINGATAN: Scraper atau automated client. Pantau frekuensi request.';
      } else if (plain.bot_category === 'search_engine') {
        actionRecommendation = 'AMAN: Mesin pencari resmi (Membantu SEO Google/Bing). Jangan diblokir.';
      } else if (plain.bot_category === 'social_preview') {
        actionRecommendation = 'AMAN: Bot preview tautan media sosial / WhatsApp.';
      }

      return {
        ...plain,
        action_recommendation: actionRecommendation,
      };
    });

    res.status(200).json({
      status: true,
      message: 'Berhasil memuat log deteksi bot.',
      data: {
        logs: enrichedLogs,
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (error) {
    logger.error('getBotLogs error:', error);
    res.status(500).json({ status: false, message: 'Gagal memuat log bot', error: error.message });
  }
};

module.exports = {
  collectAnalytics,
  getAnalyticsOverview,
  getVisitorLogs,
  getBotLogs,
};
