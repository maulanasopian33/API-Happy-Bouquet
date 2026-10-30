const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

class LogController {
  async listLogs(req, res) {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        return successResponse(res, 'Daftar log kosong', []);
      }

      const files = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          date: file.replace('.log', ''),
          size: fs.statSync(path.join(logDir, file)).size
        }))
        .sort((a, b) => b.date.localeCompare(a.date));

      return successResponse(res, 'Daftar file log berhasil diambil', files);
    } catch (error) {
      return errorResponse(res, error.message, null, 500);
    }
  }

  async getLogByDate(req, res) {
    try {
      const { date } = req.params;

      // Validasi ketat format tanggal YYYY-MM-DD untuk mencegah Path Traversal
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse(res, 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.', null, 400);
      }

      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `${date}.log`);

      if (!logFile.startsWith(logDir)) {
        return errorResponse(res, 'Akses file ditolak', null, 403);
      }

      if (!fs.existsSync(logFile)) {
        return errorResponse(res, 'File log tidak ditemukan', null, 404);
      }

      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);

      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { message: line, raw: true };
        }
      });

      return successResponse(res, 'Isi file log berhasil diambil', logs);
    } catch (error) {
      return errorResponse(res, error.message, null, 500);
    }
  }

  async createFrontEndLog(req, res) {
    try {
      const { level, message, meta } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return errorResponse(res, 'Message wajib diisi', null, 400);
      }

      // Cegah disk exhaustion DoS: batasi panjang pesan maksimal 1000 karakter
      if (message.length > 1000) {
        return errorResponse(res, 'Panjang pesan log maksimal 1000 karakter', null, 400);
      }

      const safeLevel = ['error', 'warn', 'info'].includes(level) ? level : 'info';
      const safeMeta = (meta && typeof meta === 'object' && !Array.isArray(meta)) ? meta : {};

      const logMethods = {
        error: logger.error,
        warn: logger.warn,
        info: logger.info,
      };
      const logMethod = logMethods[safeLevel] || logger.info;
      logMethod({
        source: 'Frontend',
        message: message.trim(),
        ...safeMeta
      });

      return successResponse(res, 'Log tercatat');
    } catch (error) {
      return errorResponse(res, error.message, null, 500);
    }
  }
}

module.exports = new LogController();
