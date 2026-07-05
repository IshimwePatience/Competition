const express = require('express');
const creditController = require('../controllers/creditController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { creditActionRules } = require('../middleware/validators');

const router = express.Router();

router.use(authenticate);

router.get('/balance', creditController.getBalance);
router.get('/history', creditController.getHistory);
router.post('/actions', creditActionRules, validate, creditController.recordAction);
router.post('/redeem', creditController.redeem);

module.exports = router;
