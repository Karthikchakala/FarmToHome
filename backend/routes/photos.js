const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Serve static images from the photos folder
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../photos', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }

  // Send the file
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving image:', err);
      res.status(500).json({
        success: false,
        message: 'Error serving image'
      });
    }
  });
});

// Get all available images (for debugging/admin purposes)
router.get('/', (req, res) => {
  const photosDir = path.join(__dirname, '../photos');
  
  if (!fs.existsSync(photosDir)) {
    return res.json({
      success: true,
      data: {
        images: []
      },
      message: 'No images directory found'
    });
  }

  try {
    const files = fs.readdirSync(photosDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    res.json({
      success: true,
      data: {
        images: imageFiles.map(file => ({
          filename: file,
          url: `/api/photos/${file}`,
          size: fs.statSync(path.join(photosDir, file)).size
        }))
      },
      message: 'Images retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading images directory:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading images directory'
    });
  }
});

module.exports = router;
