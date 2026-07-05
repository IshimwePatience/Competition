const express = require('express');
const triageController = require('../controllers/triageController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { triageLimiter } = require('../middleware/rateLimiter');
const { triageRules } = require('../middleware/validators');

const router = express.Router();

router.use(authenticate);

router.post('/analyze', triageLimiter, triageRules, validate, triageController.analyze);
router.get('/history', triageController.history);

module.exports = router;
