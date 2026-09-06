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
      const logFile = path.join(process.cwd(), 'logs', `${date}.log`);

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

      if (!message) {
        return errorResponse(res, 'Message wajib diisi', null, 400);
      }

      const logMethods = {
        error: logger.error,
        warn: logger.warn,
        info: logger.info,
        http: logger.http,
        verbose: logger.verbose,
        debug: logger.debug,
        silly: logger.silly,
      };
      const logMethod = logMethods[level] || logger.info;
      logMethod({
        source: 'Frontend',
        message,
        ...meta
      });

      return successResponse(res, 'Log tercatat');
    } catch (error) {
      return errorResponse(res, error.message, null, 500);
    }
  }
}

module.exports = new LogController();
