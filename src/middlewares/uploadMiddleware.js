"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Format file tidak didukung! Hanya file gambar JPG, JPEG, PNG, dan WebP yang diizinkan.'), false);
  }
  cb(null, true);
};

const createUploader = (folderName, prefix) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = `public/uploads/${folderName}`;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
      cb(null, `${prefix}-${uniqueSuffix}${safeExt}`);
    },
  });

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
  });
};

module.exports = { createUploader };
