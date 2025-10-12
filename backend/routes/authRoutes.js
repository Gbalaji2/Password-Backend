const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

// Register
router.post('/register', authCtrl.register);

// Forgot password
router.post('/forgot-password', authCtrl.forgotPassword);
router.get('/validate-reset-token/:token', authCtrl.validateResetToken);
router.post('/reset-password/:token', authCtrl.resetPassword);

module.exports = router;

