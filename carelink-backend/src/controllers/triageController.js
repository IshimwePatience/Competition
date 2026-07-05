const triageService = require('../services/triageService');
const { COMMON_SYMPTOMS } = require('../constants/symptoms');

const analyze = async (req, res, next) => {
  try {
    const session = await triageService.analyzeSymptoms(req.user.id, req.body.symptoms);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

const analyzePublic = async (req, res, next) => {
  try {
    const result = await triageService.analyzePublicSymptoms(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const symptomList = async (req, res) => {
  res.json({ success: true, data: COMMON_SYMPTOMS });
};

const history = async (req, res, next) => {
  try {
    const result = await triageService.getHistory(req.user.id, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyze, analyzePublic, symptomList, history };
