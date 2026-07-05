const express = require('express');
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authenticate, searchController.globalSearch);

module.exports = router;
