import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';

class LogController {
  /**
   * List all log files in the logs directory
   */
  public async listLogs(req: Request, res: Response) {
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
    } catch (error: any) {
      return errorResponse(res, error.message, null, 500);
    }
  }

  /**
   * Read a specific log file and return as JSON
   */
  public async getLogByDate(req: Request, res: Response) {
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
    } catch (error: any) {
      return errorResponse(res, error.message, null, 500);
    }
  }

  /**
   * Create a log entry from the frontend
   */
  public async createFrontEndLog(req: Request, res: Response) {
    try {
      const { level, message, meta } = req.body;

      if (!message) {
        return errorResponse(res, 'Message wajib diisi', null, 400);
      }

      const logMethod = (logger as any)[level] || logger.info;
      logMethod.call(logger, {
        source: 'Frontend',
        message,
        ...meta
      });

      return successResponse(res, 'Log tercatat');
    } catch (error: any) {
      return errorResponse(res, error.message, null, 500);
    }
  }
}

export default new LogController();
