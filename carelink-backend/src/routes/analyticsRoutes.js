const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { triageLimiter } = require('../middleware/rateLimiter');
const { adminAiRules } = require('../middleware/validators');

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin'), analyticsController.dashboard);
router.get('/admin-ai/snapshot', authenticate, authorize('admin'), analyticsController.adminSnapshot);
router.post('/admin-ai/query', authenticate, authorize('admin'), triageLimiter, adminAiRules, validate, analyticsController.adminAiQuery);

module.exports = router;
