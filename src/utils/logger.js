const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

const { sanitize, isSensitiveKey, REDACTED } = require('./logSanitize');

const logDir = path.resolve(process.env.LOG_DIR || 'logs');
fs.mkdirSync(logDir, { recursive: true });

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');
const maxFiles = process.env.LOG_MAX_FILES || '14d';

const addBaseFields = winston.format((info) => {
  info.service = 'api-happybouquet';
  info.env = process.env.NODE_ENV || 'development';
  return info;
});

const redact = winston.format((info) => {
  Object.keys(info).forEach((key) => {
    if (key === 'level') return;
    info[key] = isSensitiveKey(key) ? REDACTED : sanitize(info[key]);
  });
  return info;
});

// Logger-level format: setiap transport menambahkan formatnya sendiri (json / console).
const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  addBaseFields(),
  redact()
);

const rotate = (filename, transportLevel) =>
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, filename),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxSize: '20m',
    maxFiles,
    level: transportLevel,
    format: winston.format.json(),
  });

const logger = winston.createLogger({
  level,
  format: baseFormat,
  transports: [rotate('%DATE%.log'), rotate('error-%DATE%.log', 'error')],
});

// Console hanya untuk dev/test; di production cukup file agar tidak menggandakan I/O.
if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level: logLevel, message, ...meta }) => {
          const extras = Object.entries(meta)
            .filter(([key]) => !['service', 'env'].includes(key))
            .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join(' ');
          return `${timestamp} ${logLevel}: ${message}${extras ? ` ${extras}` : ''}`;
        })
      ),
    })
  );
}

// Exception/rejection tak tertangani jangan hilang ke stderr saja (dimatikan saat test).
if (!isTest) {
  logger.exceptions.handle(rotate('exceptions-%DATE%.log'));
  logger.rejections.handle(rotate('rejections-%DATE%.log'));
}

module.exports = logger;
