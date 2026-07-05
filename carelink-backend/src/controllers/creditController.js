const creditService = require('../services/creditService');

const getBalance = async (req, res, next) => {
  try {
    const result = await creditService.getBalance(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const result = await creditService.getHistory(req.user.id, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const recordAction = async (req, res, next) => {
  try {
    const result = await creditService.recordHealthyAction(
      req.user.id,
      req.body.actionType,
      req.body.description
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const redeem = async (req, res, next) => {
  try {
    const result = await creditService.redeemScreening(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBalance, getHistory, recordAction, redeem };
