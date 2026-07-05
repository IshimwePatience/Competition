const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reportRules, uuidParam } = require('../middleware/validators');

const router = express.Router();

router.use(authenticate);

router.get('/', reportController.getReports);
router.post('/:facilityId', uuidParam('facilityId'), validate, reportRules, validate, reportController.submit);
router.patch('/:id/verify', authorize('admin', 'health_worker'), uuidParam('id'), validate, reportController.verify);
router.patch('/:id/reject', authorize('admin'), uuidParam('id'), validate, reportController.reject);

module.exports = router;
