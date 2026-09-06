"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const videoFileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only mp4 and mov files are allowed!'), false);
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
    cb(null, `tiktok-video-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const tiktokVideoUploader = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = { tiktokVideoUploader };
