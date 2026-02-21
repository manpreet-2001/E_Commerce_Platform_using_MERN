const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

const MAX_MULTIPLE_FILES = 10;

// In production, set BACKEND_URL (e.g. https://your-api.onrender.com) so stored image URLs
// are absolute and work when the frontend is on a different origin.
function getBaseUrl(req) {
  return process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
}

function fileToUrl(req, file) {
  return `${getBaseUrl(req)}/uploads/${file.filename}`;
}

// @route   POST /api/upload
// @desc    Upload a single image (field name: "image")
// @access  Private (vendor, admin)
router.post('/', protect, authorize('vendor', 'admin'), (req, res) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB'
        });
      }
      if (err.message && err.message.startsWith('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Use field name "image"'
      });
    }

    const imageUrl = fileToUrl(req, req.file);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      url: imageUrl,
      filename: req.file.filename
    });
  });
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple images (field name: "images", max 10 files, 5MB each)
// @access  Private (vendor, admin)
router.post('/multiple', protect, authorize('vendor', 'admin'), (req, res) => {
  const uploadMultiple = upload.array('images', MAX_MULTIPLE_FILES);

  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'One or more files too large. Maximum size per file is 5MB'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum is ${MAX_MULTIPLE_FILES} images per request`
        });
      }
      if (err.message && err.message.startsWith('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed'
      });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded. Use field name "images" and send one or more image files'
      });
    }

    const baseUrl = getBaseUrl(req);
    const urls = files.map((file) => `${baseUrl}/uploads/${file.filename}`);
    const filenames = files.map((file) => file.filename);

    res.status(201).json({
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      urls,
      filenames,
      count: files.length
    });
  });
});

module.exports = router;
