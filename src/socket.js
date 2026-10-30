const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const redis = require('./config/redis');
const logger = require('./utils/logger');

let io;

const isProduction = process.env.NODE_ENV === 'production';

// CORS origins untuk Socket.io — konsisten dengan Express CORS
const socketAllowedOrigins = (() => {
  if (!isProduction) return '*';
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return []; // In production without config: deny wildcard credentials
  const origins = raw.split(',').map(o => o.trim()).filter(Boolean);
  return origins;
})();

// Batas waktu session dianggap "aktif" (5 menit sejak aktivitas terakhir)
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const HISTORY_POINTS = 12;
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

let trafficHistory = [];

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: socketAllowedOrigins.length > 0 ? socketAllowedOrigins : false,
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  // Autentikasi JWT Handshake untuk WebSocket
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.split(' ')[1]) ||
      socket.handshake.headers?.cookie?.match(/hb_token=([^;]+)/)?.[1];

    if (!token) {
      return next(new Error('Autentikasi diperlukan untuk koneksi WebSocket.'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error('JWT_SECRET tidak dikonfigurasi.'));
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return next(new Error('Token tidak valid atau kedaluwarsa.'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    logger.info(`🔗 New authenticated socket connection: ${socket.id} (user: ${socket.user?.id}, role: ${socket.user?.role})`);

    // Hanya role admin/super_admin yang diizinkan join ke room analytics
    socket.on('join_admin_analytics', () => {
      const role = String(socket.user?.role || '').toLowerCase();
      if (!['admin', 'super_admin'].includes(role)) {
        logger.warn(`[Socket] Unauthorized join_admin_analytics attempt by user ${socket.user?.id} (role: ${role})`);
        return socket.emit('error', { message: 'Akses ditolak. Memerlukan hak akses admin.' });
      }

      socket.join('admin_analytics');
      logger.info(`Admin socket ${socket.id} joined admin_analytics room`);
      broadcastActiveVisitors();
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Setup broadcast analytics berkala ke room admin_analytics setiap 5 detik
  setInterval(() => {
    broadcastActiveVisitors();
  }, 5000);

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const toTimeStr = (date) => date.toLocaleTimeString('id-ID', TIME_FORMAT);

// ─── Data nyata (production): dibaca dari Redis ──────────────────
const getRealActiveVisitors = async () => {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  return redis.zcount('analytics:active_visitors', cutoff, '+inf');
};

const getRealTopProducts = async () => {
  const rows = await redis.zrevrange('analytics:top_urls', 0, 4, 'WITHSCORES');
  const top = [];
  for (let i = 0; i + 1 < rows.length; i += 2) {
    top.push({ url: String(rows[i]), views: Number(rows[i + 1]) });
  }
  return top;
};

const getRealDeviceStats = async () => {
  const raw = await redis.lrange('analytics:raw_logs', 0, 49);
  const counts = {};
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

const broadcastActiveVisitors = async () => {
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

module.exports = { initSocket, getIO, broadcastActiveVisitors };
