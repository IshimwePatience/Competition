const analyticsService = require('../services/analyticsService');
const adminAiService = require('../services/adminAiService');

const dashboard = async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboard();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const adminSnapshot = async (req, res, next) => {
  try {
    const data = await adminAiService.getAdminSnapshot();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const adminAiQuery = async (req, res, next) => {
  try {
    const result = await adminAiService.queryAdminAi(req.body.question);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { dashboard, adminSnapshot, adminAiQuery };
