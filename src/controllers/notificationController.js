const { successResponse, errorResponse } = require('../utils/response');
const notificationService = require('../services/notificationService');

const getMyNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Autentikasi diperlukan', null, 401);
    }
    const user = req.user;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const data = await notificationService.getNotificationLogs(user.id, page, limit);
    return successResponse(res, 'Notifikasi berhasil diambil', data);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const subscribeStream = (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Autentikasi diperlukan', null, 401);
    }

    const userId = req.user.id;

    // Headers untuk Server-Sent Events (SSE)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    if (res.flushHeaders) res.flushHeaders();

    // Kirim event koneksi awal
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', userId })}\n\n`);

    notificationService.addSSEClient(userId, res);

    // Heartbeat berkala (25s) agar proxy/reverse-proxy/Passenger tidak memutus koneksi
    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (_err) {
        // Abaikan jika stream sudah tertutup
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      notificationService.removeSSEClient(userId, res);
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getMyNotifications,
  subscribeStream,
};
