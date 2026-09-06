const redis = require('../config/redis');
const { parseVisitorData } = require('../utils/analyticsHelper');
const logger = require('../utils/logger');

const collectAnalytics = async (req, res) => {
  try {
    const payload = req.body;
    
    if (!payload.session_id || !payload.url) {
       res.status(400).json({ error: 'session_id and url are required' });
       return;
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const uaString = req.headers['user-agent'] || '';

    if (payload.event_type === 'exit') {
      await redis.zrem('analytics:active_visitors', payload.session_id);
      res.status(200).send('OK');
      return;
    }

    const now = Date.now();
    await redis.zadd('analytics:active_visitors', now, payload.session_id);

    if (payload.event_type === 'pageview') {
      await redis.zincrby('analytics:top_urls', 1, payload.url);
      
      const visitorData = parseVisitorData(ip, uaString, payload.url);
      
      const logEntry = JSON.stringify({
        ...payload,
        ...visitorData,
        ip,
        timestamp: now
      });
      await redis.lpush('analytics:raw_logs', logEntry);
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Analytics collect error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  collectAnalytics,
};
