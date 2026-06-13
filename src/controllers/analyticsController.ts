import { Request, Response } from 'express';
import redis from '../config/redis';
import { parseVisitorData, AnalyticsPayload } from '../utils/analyticsHelper';
import logger from '../utils/logger';

export const collectAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload: AnalyticsPayload = req.body;
    
    if (!payload.session_id || !payload.url) {
       res.status(400).json({ error: 'session_id and url are required' });
       return;
    }

    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
    const uaString = req.headers['user-agent'] || '';

    // Pada event 'disconnect' atau exit, kita hapus dari active visitors
    if (payload.event_type === 'exit') {
      await redis.zrem('analytics:active_visitors', payload.session_id);
      res.status(200).send('OK');
      return;
    }

    // Perbarui waktu aktif session di Redis (menggunakan timestamp saat ini sebagai score)
    const now = Date.now();
    await redis.zadd('analytics:active_visitors', now, payload.session_id);

    // Track URL Views (Sederhana: menaikkan score URL di Sorted Set)
    if (payload.event_type === 'pageview') {
      await redis.zincrby('analytics:top_urls', 1, payload.url);
      
      // Parse detailed data
      const visitorData = parseVisitorData(ip, uaString, payload.url);
      
      // Anda dapat mem-push data mentah ke Redis List untuk diproses oleh Cron Job nantinya
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
