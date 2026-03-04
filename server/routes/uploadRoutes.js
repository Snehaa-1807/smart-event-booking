const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/upload');

// POST /api/upload — handles single image upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // Return the accessible URL path
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: imageUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

module.exports = router;