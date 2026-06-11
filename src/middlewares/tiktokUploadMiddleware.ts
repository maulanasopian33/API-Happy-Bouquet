import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const videoFileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['video/mp4', 'video/quicktime']; // quicktime = mov
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only mp4 and mov files are allowed!'), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Gunakan folder temporer dari OS (/tmp)
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

export const tiktokVideoUploader = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});
