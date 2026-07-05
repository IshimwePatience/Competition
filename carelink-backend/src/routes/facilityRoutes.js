const express = require('express');
const facilityController = require('../controllers/facilityController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { facilityCreateRules, nearbyRules, uuidParam } = require('../middleware/validators');

const router = express.Router();

router.get('/', facilityController.getAll);
router.get('/nearby', nearbyRules, validate, facilityController.getNearby);
router.get('/:id', uuidParam('id'), validate, facilityController.getById);

router.post('/', authenticate, authorize('admin'), facilityCreateRules, validate, facilityController.create);
router.patch('/:id', authenticate, authorize('admin', 'health_worker'), uuidParam('id'), validate, facilityController.update);
router.delete('/:id', authenticate, authorize('admin'), uuidParam('id'), validate, facilityController.remove);

module.exports = router;
