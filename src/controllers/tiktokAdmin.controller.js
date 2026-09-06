const { TiktokService } = require('../services/tiktok.service');
const crypto = require('crypto');
const { successResponse, errorResponse } = require('../utils/response');

class TiktokAdminController {
  static async getStatus(req, res) {
    try {
      const status = await TiktokService.getConnectionStatus();
      successResponse(res, 'Status koneksi TikTok berhasil diambil', status);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async getAuthUrl(req, res) {
    const mockAuthUrl = `http://localhost:5173/admin/tiktok-settings?mock_callback=true`;
    successResponse(res, 'URL otorisasi TikTok berhasil dibuat', { url: mockAuthUrl });
  }

  static async handleCallback(req, res) {
    try {
      const adminId = req.user?.id || 1;

      const openId = 'mock_open_id_' + crypto.randomBytes(4).toString('hex');
      const username = '@mock_admin_tiktok';
      const accessToken = 'mock_access_token_' + crypto.randomBytes(8).toString('hex');
      const refreshToken = 'mock_refresh_token_' + crypto.randomBytes(8).toString('hex');

      const expiresIn = 2 * 60 * 60;
      const refreshExpiresIn = 365 * 24 * 60 * 60;

      await TiktokService.saveAuthToken(
        openId,
        username,
        accessToken,
        refreshToken,
        expiresIn,
        refreshExpiresIn,
        adminId
      );

      successResponse(res, 'Akun TikTok berhasil dihubungkan');
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }
}

module.exports = { TiktokAdminController };
