const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');  
const { protect } = require('../middleware/auth');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } = require('../middleware/validator');
const { authLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Resend verification email route
router.post('/resend-verification', protect, authController.resendVerification);

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.put('/update-password', protect, authController.updatePassword);
router.put('/update-profile', protect, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;