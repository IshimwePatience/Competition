const express = require('express');
const facilityController = require('../controllers/facilityController');
const facilityOwnerController = require('../controllers/facilityOwnerController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { facilityCreateRules, nearbyRules, uuidParam, stockRules } = require('../middleware/validators');

const router = express.Router();

router.get('/medicines/suggestions', facilityOwnerController.medicineSuggestions);
router.get('/nearby', nearbyRules, validate, facilityController.getNearby);

router.get('/me/profile', authenticate, authorize('facility'), facilityOwnerController.getMine);
router.patch('/me/profile', authenticate, authorize('facility'), facilityOwnerController.updateMine);
router.get('/me/stock', authenticate, authorize('facility'), facilityOwnerController.getStock);
router.put('/me/stock', authenticate, authorize('facility'), stockRules, validate, facilityOwnerController.setStock);

router.get('/', facilityController.getAll);
router.get('/:id', uuidParam('id'), validate, facilityController.getById);

router.post('/', authenticate, authorize('admin'), facilityCreateRules, validate, facilityController.create);
router.patch('/:id', authenticate, authorize('admin', 'health_worker'), uuidParam('id'), validate, facilityController.update);
router.delete('/:id', authenticate, authorize('admin'), uuidParam('id'), validate, facilityController.remove);

module.exports = router;
