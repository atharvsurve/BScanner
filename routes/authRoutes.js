const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/admin', authMiddleware, authController.getAllUsers);


module.exports = router;
