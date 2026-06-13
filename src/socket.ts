import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import redis from './config/redis';
import logger from './utils/logger';

let io: Server;

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

let mockActiveCount = 124;
let mockTrafficHistory = Array.from({ length: 12 }, (_, i) => ({
  time: new Date(Date.now() - (11 - i) * 5000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  count: Math.floor(Math.random() * 50) + 100
}));

export const broadcastActiveVisitors = async () => {
  try {
    if (!io) return;
    
    // Generate Mock Data as requested by User
    const fluctuation = Math.floor(Math.random() * 15) - 5; // -5 to +10
    mockActiveCount = Math.max(10, mockActiveCount + fluctuation);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    mockTrafficHistory.push({ time: timeStr, count: mockActiveCount });
    if (mockTrafficHistory.length > 12) mockTrafficHistory.shift(); // Keep last 12 points (1 minute of 5s intervals)

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
      timestamp: now.getTime()
    });
  } catch (error) {
    logger.error('Error broadcasting analytics:', error);
  }
};
