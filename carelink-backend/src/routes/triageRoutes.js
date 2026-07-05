const express = require('express');
const triageController = require('../controllers/triageController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { triageLimiter } = require('../middleware/rateLimiter');
const { triageRules, publicTriageRules } = require('../middleware/validators');

const router = express.Router();

router.get('/symptoms', triageController.symptomList);
router.post('/public', triageLimiter, publicTriageRules, validate, triageController.analyzePublic);

router.use(authenticate);

router.post('/analyze', triageLimiter, triageRules, validate, triageController.analyze);
router.get('/history', triageController.history);

module.exports = router;
