const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin'), analyticsController.dashboard);

module.exports = router;
