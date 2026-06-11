import multer from 'multer';
import path from 'path';
import fs from 'fs';

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const createUploader = (folderName: string, prefix: string) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = `public/uploads/${folderName}`;
      // Ensure directory exists
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
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  });
};
