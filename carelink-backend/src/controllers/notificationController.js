const notificationService = require('../services/notificationService');
const { User } = require('../models');

const getAll = async (req, res, next) => {
  try {
    const result = await notificationService.getForUser(req.user.id, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.user.id, req.params.id);
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const createCampaign = async (req, res, next) => {
  try {
    let userIds = req.body.userIds;
    if (!userIds?.length) {
      const users = await User.findAll({ attributes: ['id'] });
      userIds = users.map((u) => u.id);
    }
    const notifications = await notificationService.createCampaign({
      ...req.body,
      userIds,
    });
    res.status(201).json({ success: true, data: { count: notifications.length } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, markRead, markAllRead, createCampaign };
