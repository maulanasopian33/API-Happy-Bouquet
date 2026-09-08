const { GoogleAuthService } = require('../services/google-business/googleAuth.service');
const { GoogleBusinessService } = require('../services/googleBusiness.service');
const { getQuotaStatus, resetQuota } = require('../services/google-business/googleQuota.service');
const { successResponse, errorResponse } = require('../utils/response');
const crypto = require('crypto');

class GoogleBusinessController {
  // ─── AUTH ──────────────────────────────────────────────────────
  static async getStatus(req, res) {
    try {
      const status = await GoogleAuthService.getConnectionStatus();
      successResponse(res, 'Status koneksi Google Business berhasil diambil', status);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async getAuthUrl(req, res) {
    try {
      const state = crypto.randomBytes(16).toString('hex');
      const url = GoogleAuthService.getAuthUrl(state);
      successResponse(res, 'URL otorisasi Google Business berhasil dibuat', { url, state });
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async handleCallback(req, res) {
    try {
      const { code, state } = req.query;
      const adminId = req.user?.id || 1;

      if (!code) {
        return errorResponse(res, 'Authorization code tidak ditemukan', null, 400);
      }

      const tokenData = await GoogleAuthService.exchangeCode(code);
      const setting = await GoogleAuthService.saveAuthToken(tokenData, adminId);

      successResponse(res, 'Akun Google Business berhasil dihubungkan', {
        connected: true,
        google_account_email: setting.google_account_email,
      });
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async disconnect(req, res) {
    try {
      await GoogleAuthService.disconnect();
      successResponse(res, 'Akun Google Business berhasil diputuskan');
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  // ─── ACCOUNTS & LOCATIONS ──────────────────────────────────────
  static async listAccounts(req, res) {
    try {
      const data = await GoogleBusinessService.listAccounts();
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Daftar akun Google Business berhasil diambil', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async listLocations(req, res) {
    try {
      const { accountName } = req.query;
      let data;
      if (accountName) {
        data = await GoogleBusinessService.listLocations(accountName);
      } else {
        data = await GoogleBusinessService.listAllLocations();
      }
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Daftar lokasi berhasil diambil', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async getLocationDetail(req, res) {
    try {
      const { locationName } = req.params;
      const data = await GoogleBusinessService.getLocationDetail(locationName);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Detail lokasi berhasil diambil', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async updateLocation(req, res) {
    try {
      const { locationName } = req.params;
      const { title, phone, website } = req.body;

      const payload = {};
      if (title !== undefined) payload.title = title;
      if (phone !== undefined) payload.phoneNumbers = { primaryPhone: phone };
      if (website !== undefined) payload.websiteUri = website;

      const data = await GoogleBusinessService.updateLocation(locationName, payload);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Info bisnis berhasil diperbarui', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async updateHours(req, res) {
    try {
      const { locationName } = req.params;
      const { days, openTime, closeTime } = req.body;

      if (!days || !days.length || !openTime || !closeTime) {
        return errorResponse(res, 'Hari, jam buka, dan jam tutup wajib diisi', null, 400);
      }

      const [oh, om] = openTime.split(':').map(Number);
      const [ch, cm] = closeTime.split(':').map(Number);

      const periods = days.map(day => ({
        openDay: day,
        openTime: { hours: oh, minutes: om },
        closeDay: day,
        closeTime: { hours: ch, minutes: cm },
      }));

      const data = await GoogleBusinessService.updateHours(locationName, periods);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Jam operasional berhasil diperbarui', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  // ─── REVIEWS ───────────────────────────────────────────────────
  static async listReviews(req, res) {
    try {
      const { locationV4Name } = req.params;
      const data = await GoogleBusinessService.listReviews(locationV4Name);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Daftar ulasan berhasil diambil', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async replyReview(req, res) {
    try {
      const { reviewName } = req.params;
      const { comment } = req.body;

      if (!comment) {
        return errorResponse(res, 'Balasan wajib diisi', null, 400);
      }

      const data = await GoogleBusinessService.replyReview(reviewName, comment);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Balasan ulasan berhasil dikirim', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async deleteReply(req, res) {
    try {
      const { reviewName } = req.params;
      const data = await GoogleBusinessService.deleteReply(reviewName);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Balasan ulasan berhasil dihapus', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  // ─── POSTS ─────────────────────────────────────────────────────
  static async listPosts(req, res) {
    try {
      const { locationV4Name } = req.params;
      const data = await GoogleBusinessService.listPosts(locationV4Name);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Daftar postingan berhasil diambil', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async createPost(req, res) {
    try {
      const { locationV4Name } = req.params;
      const { summary, ctaType, ctaUrl } = req.body;

      if (!summary) {
        return errorResponse(res, 'Deskripsi postingan wajib diisi', null, 400);
      }

      const data = await GoogleBusinessService.createPost(locationV4Name, { summary, ctaType, ctaUrl });
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Postingan berhasil dipublikasikan ke Google Maps', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async deletePost(req, res) {
    try {
      const { postName } = req.params;
      const data = await GoogleBusinessService.deletePost(postName);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Postingan berhasil dihapus', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  // ─── MEDIA (PHOTOS) ───────────────────────────────────────────
  static async listMedia(req, res) {
    try {
      const { locationV4Name } = req.params;
      const data = await GoogleBusinessService.listMedia(locationV4Name);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Daftar foto berhasil diambil', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async uploadPhoto(req, res) {
    try {
      const { locationV4Name } = req.params;
      const { photoUrl, category } = req.body;

      if (!photoUrl) {
        return errorResponse(res, 'URL foto wajib diisi', null, 400);
      }

      const data = await GoogleBusinessService.uploadPhoto(locationV4Name, { photoUrl, category });
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Foto berhasil diunggah ke profil bisnis', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async deleteMedia(req, res) {
    try {
      const { mediaName } = req.params;
      const data = await GoogleBusinessService.deleteMedia(mediaName);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Foto berhasil dihapus', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  // ─── PERFORMANCE ───────────────────────────────────────────────
  static async fetchPerformance(req, res) {
    try {
      const { locationName } = req.params;
      const days = parseInt(req.query.days || '30', 10);

      if (![7, 30, 90].includes(days)) {
        return errorResponse(res, 'Rentang waktu harus 7, 30, atau 90 hari', null, 400);
      }

      const data = await GoogleBusinessService.fetchPerformance(locationName, days);
      if (data.error) return errorResponse(res, data.error.message, data.error, data.error.status);
      successResponse(res, 'Data performa berhasil diambil', data);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  // ─── QUOTA ────────────────────────────────────────────────────
  static async getQuota(req, res) {
    try {
      const quota = getQuotaStatus();
      successResponse(res, 'Status quota API berhasil diambil', quota);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async resetQuotaCounter(req, res) {
    try {
      resetQuota();
      successResponse(res, 'Counter quota berhasil direset');
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }
}

module.exports = { GoogleBusinessController };
