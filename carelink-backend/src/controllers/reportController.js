const reportService = require('../services/reportService');

const submit = async (req, res, next) => {
  try {
    const report = await reportService.submitReport(req.user.id, req.params.facilityId, req.body);
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const result = await reportService.getReports(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const verify = async (req, res, next) => {
  try {
    const report = await reportService.verifyReport(req.params.id, req.user.id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const report = await reportService.rejectReport(req.params.id, req.user.id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

module.exports = { submit, getReports, verify, reject };
