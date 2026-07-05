const searchService = require('../services/searchService');

const globalSearch = async (req, res, next) => {
  try {
    const result = await searchService.search(req.query.q, { limit: req.query.limit });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { globalSearch };
