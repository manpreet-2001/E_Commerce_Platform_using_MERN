const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isConfigured: useCloudinary } = require('../config/cloudinary');

const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!useCloudinary && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = (file.mimetype === 'image/jpeg' && '.jpg') ||
      (file.mimetype === 'image/png' && '.png') ||
      (file.mimetype === 'image/gif' && '.gif') ||
      (file.mimetype === 'image/webp' && '.webp') ||
      path.extname(file.originalname) ||
      '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const storage = useCloudinary ? multer.memoryStorage() : diskStorage;

const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: JPEG, PNG, GIF, WebP. Got: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = upload;
