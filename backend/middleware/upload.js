const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed image mime types
const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Sanitize filename: remove path traversal and special chars
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.{2,}/g, '');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext || !['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      ext = '.jpg';
    }
    const base = sanitizeFilename(path.basename(file.originalname, path.extname(file.originalname))) || 'image';
    const filename = `${Date.now()}-${base}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedMimes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Single image upload middleware - attaches file to req.file
 * Use as: upload.single('image')
 */
module.exports = upload;
