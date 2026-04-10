import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

class LogController {
  /**
   * List all log files in the logs directory
   */
  public async listLogs(req: Request, res: Response) {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        return res.json({ status: 'success', data: [] });
      }

      const files = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          date: file.replace('.log', ''),
          size: fs.statSync(path.join(logDir, file)).size
        }))
        .sort((a, b) => b.date.localeCompare(a.date));

      res.json({ status: 'success', data: files });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
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
        return res.status(404).json({ status: 'error', message: 'Log file not found' });
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

      res.json({ status: 'success', data: logs });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Create a log entry from the frontend
   */
  public async createFrontEndLog(req: Request, res: Response) {
    try {
      const { level, message, meta } = req.body;

      if (!message) {
        return res.status(400).json({ status: 'error', message: 'Message is required' });
      }

      const logMethod = (logger as any)[level] || logger.info;
      logMethod.call(logger, {
        source: 'Frontend',
        message,
        ...meta
      });

      res.json({ status: 'success', message: 'Log recorded' });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}

export default new LogController();
