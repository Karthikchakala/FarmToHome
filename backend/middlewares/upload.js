const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure photos directory exists
const photosDir = path.join(__dirname, '../photos');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, photosDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

// Middleware to handle multiple image uploads
const uploadImages = upload.array('images', 5);

// Middleware to handle single image upload
const uploadImage = upload.single('image');

// Helper function to get image URL
const getImageUrl = (filename) => {
  if (!filename) return null;
  return `/api/photos/${filename}`;
};

// Helper function to get multiple image URLs
const getImageUrls = (filenames) => {
  if (!filenames || !Array.isArray(filenames)) return [];
  return filenames.map(filename => getImageUrl(filename));
};

// Helper function to delete an image file
const deleteImage = (filename) => {
  if (!filename) return;
  
  const filePath = path.join(photosDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper function to delete multiple images
const deleteImages = (filenames) => {
  if (!filenames || !Array.isArray(filenames)) return;
  filenames.forEach(filename => deleteImage(filename));
};

// Helper function to extract filename from URL
const extractFilename = (url) => {
  if (!url) return null;
  return url.split('/').pop();
};

// Helper function to extract filenames from URLs
const extractFilenames = (urls) => {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(url => extractFilename(url));
};

module.exports = {
  uploadImages,
  uploadImage,
  getImageUrl,
  getImageUrls,
  deleteImage,
  deleteImages,
  extractFilename,
  extractFilenames
};
