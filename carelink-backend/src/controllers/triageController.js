const triageService = require('../services/triageService');
const { COMMON_SYMPTOMS } = require('../constants/symptoms');

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

const findMedicines = async (req, res, next) => {
  try {
    const result = await triageService.findPublicMedicines(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyzePublic, findMedicines, symptomList };
