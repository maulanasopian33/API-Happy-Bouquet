import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import redis from './config/redis';
import logger from './utils/logger';

let io: Server;

const isProduction = process.env.NODE_ENV === 'production';

// Batas waktu session dianggap "aktif" (5 menit sejak aktivitas terakhir)
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const HISTORY_POINTS = 12;
const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

let trafficHistory: { time: string; count: number }[] = [];

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Di production, ganti dengan domain frontend yang diizinkan
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`🔗 New socket connection: ${socket.id}`);

    // Admin bisa join room khusus untuk mendapat broadcast analytics
    socket.on('join_admin_analytics', () => {
      socket.join('admin_analytics');
      logger.info(`Socket ${socket.id} joined admin_analytics room`);
      // Kirim initial data jika diperlukan
      broadcastActiveVisitors();
    });

    socket.on('join_user', (userId: number) => {
      socket.join(`user_${userId}`);
      logger.info(`Socket ${socket.id} joined user_${userId} room`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Setup Redis Pub/Sub untuk realtime broadcast lintas instance (jika di-scale)
  // Untuk versi sederhana, kita akan gunakan timer interval yang membaca dari Redis
  // dan mem-broadcast ke room admin_analytics setiap 5 detik.
  setInterval(() => {
    broadcastActiveVisitors();
  }, 5000);

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const toTimeStr = (date: Date) => date.toLocaleTimeString('id-ID', TIME_FORMAT);

// ─── Data nyata (production): dibaca dari Redis ──────────────────
const getRealActiveVisitors = async (): Promise<number> => {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  return redis.zcount('analytics:active_visitors', cutoff, '+inf');
};

const getRealTopProducts = async (): Promise<{ url: string; views: number }[]> => {
  const rows = await redis.zrevrange('analytics:top_urls', 0, 4, 'WITHSCORES');
  const top: { url: string; views: number }[] = [];
  for (let i = 0; i + 1 < rows.length; i += 2) {
    top.push({ url: String(rows[i]), views: Number(rows[i + 1]) });
  }
  return top;
};

const getRealDeviceStats = async (): Promise<{ type: string; count: number }[]> => {
  const raw = await redis.lrange('analytics:raw_logs', 0, 49);
  const counts: Record<string, number> = {};
  for (const entry of raw) {
    try {
      const data = JSON.parse(entry);
      const device = data.device_type || 'desktop';
      counts[device] = (counts[device] || 0) + 1;
    } catch {
      // Abaikan entry yang tidak valid
    }
  }
  return Object.entries(counts).map(([type, count]) => ({ type, count }));
};

const broadcastRealAnalytics = async () => {
  const [activeVisitors, topProducts, deviceStats] = await Promise.all([
    getRealActiveVisitors(),
    getRealTopProducts(),
    getRealDeviceStats(),
  ]);

  trafficHistory.push({ time: toTimeStr(new Date()), count: activeVisitors });
  if (trafficHistory.length > HISTORY_POINTS) trafficHistory.shift();

  io.to('admin_analytics').emit('analytics_update', {
    activeVisitors,
    topProducts,
    trafficHistory,
    deviceStats,
    timestamp: Date.now(),
  });
};

// ─── Data mock (development only) ────────────────────────────────
let mockActiveCount = 124;
let mockTrafficHistory = Array.from({ length: HISTORY_POINTS }, (_, i) => ({
  time: toTimeStr(new Date(Date.now() - (HISTORY_POINTS - 1 - i) * 5000)),
  count: Math.floor(Math.random() * 50) + 100
}));

const broadcastMockAnalytics = () => {
  // Generate Mock Data as requested by User
  const fluctuation = Math.floor(Math.random() * 15) - 5; // -5 to +10
  mockActiveCount = Math.max(10, mockActiveCount + fluctuation);

  mockTrafficHistory.push({ time: toTimeStr(new Date()), count: mockActiveCount });
  if (mockTrafficHistory.length > HISTORY_POINTS) mockTrafficHistory.shift();

  const topProducts = [
    { url: '/products/bunga-mawar-merah', views: mockActiveCount * 0.4 },
    { url: '/products/buket-wisuda-premium', views: mockActiveCount * 0.25 },
    { url: '/products/anggrek-bulan-putih', views: mockActiveCount * 0.15 },
    { url: '/products/custom-bouquet', views: mockActiveCount * 0.1 },
    { url: '/products/vas-bunga-kaca', views: mockActiveCount * 0.1 }
  ].map(p => ({ ...p, views: Math.floor(p.views) }));

  const deviceStats = [
    { type: 'Mobile', count: Math.floor(mockActiveCount * 0.65) },
    { type: 'Desktop', count: Math.floor(mockActiveCount * 0.30) },
    { type: 'Tablet', count: Math.floor(mockActiveCount * 0.05) }
  ];

  io.to('admin_analytics').emit('analytics_update', {
    activeVisitors: mockActiveCount,
    topProducts: topProducts,
    trafficHistory: mockTrafficHistory,
    deviceStats: deviceStats,
    timestamp: Date.now()
  });
};

export const broadcastActiveVisitors = async () => {
  try {
    if (!io) return;

    if (isProduction) {
      await broadcastRealAnalytics();
    } else {
      broadcastMockAnalytics();
    }
  } catch (error) {
    logger.error('Error broadcasting analytics:', error);
  }
};
