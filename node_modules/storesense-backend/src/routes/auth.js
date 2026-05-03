const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, superAdminAuth } = require('../middleware/auth');
const { validateBusinessExists } = require('../middleware/validation');

router.post('/login', authController.login);
router.post('/super-admin/login', authController.superAdminLogin);
router.post('/profile', authMiddleware, authController.getProfile);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
