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

module.exports = {
  getMyNotifications,
};
