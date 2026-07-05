const analyticsService = require('../services/analyticsService');

const dashboard = async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboard();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { dashboard };
