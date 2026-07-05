const triageService = require('../services/triageService');

const analyze = async (req, res, next) => {
  try {
    const session = await triageService.analyzeSymptoms(req.user.id, req.body.symptoms);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

const history = async (req, res, next) => {
  try {
    const result = await triageService.getHistory(req.user.id, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyze, history };
