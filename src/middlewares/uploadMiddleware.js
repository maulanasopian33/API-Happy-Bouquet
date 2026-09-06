"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
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
      cb(null, `${prefix}-` + uniqueSuffix + path.extname(file.originalname));
    },
  });

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
  });
};

module.exports = { createUploader };
