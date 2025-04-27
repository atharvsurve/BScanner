// In your routes file (e.g., cardRoutes.js)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cardController = require('../controllers/cardController');
const auth = require('../middleware/authMiddleware'); // Import auth middleware

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Add file filter to ensure only images are uploaded
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Protected Routes - all card operations require authentication
router.post('/upload', auth, upload.single('image'), cardController.extractCardDetails);
router.post('/submit', auth, cardController.submitCardDetails);
router.get('/all', auth, cardController.getAllCards);
router.delete('/delete/:id', auth, cardController.deleteCardById); 
router.delete('/admin/delete/:id', auth, userController.deleteUser);

module.exports = router;