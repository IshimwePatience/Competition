const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, uuidParam } = require('../middleware/validators');

const router = express.Router();

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.post('/logout', authController.logout);
router.get('/google', authController.googleRedirect);
router.get('/google/callback', authController.googleCallback);
router.get('/me', authenticate, authController.getProfile);
router.patch('/me', authenticate, authController.updateProfile);
router.post('/apply-health-worker', authenticate, authController.promoteToHealthWorker);

router.get('/users', authenticate, authorize('admin'), authController.listUsers);
router.patch('/users/:id/verify', authenticate, authorize('admin'), uuidParam('id'), validate, authController.verifyHealthWorker);

module.exports = router;
