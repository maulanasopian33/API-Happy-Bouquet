const { TiktokService } = require('../services/tiktok.service');
const fs = require('fs');
const { successResponse, errorResponse } = require('../utils/response');

class TiktokUserController {
  static async publishVideo(req, res) {
    const file = req.file;
    const { caption } = req.body;

    if (!file) {
      errorResponse(res, 'File video wajib diunggah', null, 400);
      return;
    }

    if (caption && caption.length > 2000) {
      errorResponse(res, 'Caption melebihi batas 2000 karakter', null, 400);
      fs.unlinkSync(file.path);
      return;
    }

    try {
      const accessToken = await TiktokService.getActiveToken();
      if (!accessToken) {
        errorResponse(res, 'Akun TikTok belum dihubungkan oleh Admin', null, 400);
        return;
      }

      const result = await TiktokService.publishVideo(accessToken, caption || '', file.path);

      successResponse(res, 'Video berhasil dipublikasikan', result.data);
    } catch (error) {
      errorResponse(res, error.message || 'Gagal mempublikasikan video', null, 500);
    } finally {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}

module.exports = { TiktokUserController };
