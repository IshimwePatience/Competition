const express = require('express');
const triageController = require('../controllers/triageController');
const validate = require('../middleware/validate');
const { triageLimiter } = require('../middleware/rateLimiter');
const { publicTriageRules, findMedicinesRules } = require('../middleware/validators');

const router = express.Router();

router.get('/symptoms', triageController.symptomList);
router.post('/public', triageLimiter, publicTriageRules, validate, triageController.analyzePublic);
router.post('/find-medicines', triageLimiter, findMedicinesRules, validate, triageController.findMedicines);

module.exports = router;
