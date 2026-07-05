const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getAll);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);
router.post('/campaigns', authorize('admin'), notificationController.createCampaign);

module.exports = router;
