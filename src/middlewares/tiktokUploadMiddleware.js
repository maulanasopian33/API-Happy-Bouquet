"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ALLOWED_EXTS = ['.mp4', '.mov'];
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime'];

const videoFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTS.includes(ext) && ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file video MP4 dan MOV yang diizinkan!'), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(os.tmpdir(), 'tiktok_uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTS.includes(ext) ? ext : '.mp4';
    cb(null, `tiktok-video-${uniqueSuffix}${safeExt}`);
  },
});

const tiktokVideoUploader = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = { tiktokVideoUploader };
