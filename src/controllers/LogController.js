const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

// Nama file: 2026-11-04.log (gabungan) atau error-2026-11-04.log (khusus error).
const FILE_NAME = /^(error-)?\d{4}-\d{2}-\d{2}$/;
const MAX_LINES = 5000;
const TAIL_BYTES = 3 * 1024 * 1024;

const logDir = () => path.resolve(process.env.LOG_DIR || 'logs');

// Baca bagian akhir file saja — file log bisa 20 MB dan tidak boleh masuk memori penuh.
const readTail = (file) => {
  const size = fs.statSync(file).size;
  const start = Math.max(0, size - TAIL_BYTES);

  if (start === 0) return fs.readFileSync(file, 'utf8');

  const fd = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.alloc(size - start);
    fs.readSync(fd, buffer, 0, buffer.length, start);
    const content = buffer.toString('utf8');
    const firstNewline = content.indexOf('\n');
    return firstNewline === -1 ? content : content.slice(firstNewline + 1);
  } finally {
    fs.closeSync(fd);
  }
};

const parseLines = (content) =>
  content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line, raw: true };
      }
    });

class LogController {
  async listLogs(_req, res) {
    try {
      const dir = logDir();
      if (!fs.existsSync(dir)) {
        return successResponse(res, 'Daftar log kosong', []);
      }

      const files = fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.log'))
        .map((file) => ({
          name: file,
          date: file.replace('.log', ''),
          size: fs.statSync(path.join(dir, file)).size,
        }))
        .sort((a, b) => b.name.localeCompare(a.name));

      return successResponse(res, 'Daftar file log berhasil diambil', files);
    } catch (error) {
      return errorResponse(res, error.message, null, 500);
    }
  }

  async getLogByDate(req, res) {
    try {
      const { date } = req.params;

      // Validasi ketat nama file (whitelist) — mencegah path traversal.
      if (!FILE_NAME.test(date)) {
        return errorResponse(res, 'Format tanggal tidak valid. Gunakan YYYY-MM-DD atau error-YYYY-MM-DD.', null, 400);
      }

      const level = typeof req.query.level === 'string' ? req.query.level.toLowerCase() : null;
      if (level && !['error', 'warn', 'info', 'debug', 'fatal'].includes(level)) {
        return errorResponse(res, 'Level log tidak valid.', null, 400);
      }

      const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100).toLowerCase() : '';
      const requestedLimit = Number(req.query.limit);
      const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_LINES)
        : MAX_LINES;

      const logFile = path.join(logDir(), `${date}.log`);
      if (!fs.existsSync(logFile)) {
        return errorResponse(res, 'File log tidak ditemukan', null, 404);
      }

      let logs = parseLines(readTail(logFile));

      if (level) logs = logs.filter((entry) => entry.level === level);
      if (query) logs = logs.filter((entry) => JSON.stringify(entry).toLowerCase().includes(query));

      return successResponse(res, 'Isi file log berhasil diambil', logs.slice(-limit));
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

      logger.log(safeLevel, message.trim(), {
        source: 'Frontend',
        ip: req.ip,
        requestId: req.id || null,
        ...safeMeta,
      });

      return successResponse(res, 'Log tercatat');
    } catch (error) {
      return errorResponse(res, error.message, null, 500);
    }
  }
}

module.exports = new LogController();
