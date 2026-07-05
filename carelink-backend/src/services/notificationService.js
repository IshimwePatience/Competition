const { Notification } = require('../models');
const AppError = require('../utils/AppError');

const getForUser = async (userId, { unreadOnly = false, page = 1, limit = 20 }) => {
  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const offset = (page - 1) * limit;
  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { notifications: rows, total: count, page, limit };
};

const markRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new AppError('Notification not found', 404);

  notification.isRead = true;
  await notification.save();
  return notification;
};

const markAllRead = async (userId) => {
  await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
  return { message: 'All notifications marked as read' };
};

const createCampaign = async ({ title, message, userIds, metadata }) => {
  const notifications = await Promise.all(
    userIds.map((userId) =>
      Notification.create({
        userId,
        title,
        message,
        type: 'campaign',
        metadata,
      })
    )
  );

  const { emitToUser } = require('./socketService');
  notifications.forEach((n) => {
    emitToUser(n.userId, 'notification:new', {
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
    });
  });

  return notifications;
};

const notifyUser = async (userId, { title, message, type = 'system', metadata }) => {
  const notification = await Notification.create({ userId, title, message, type, metadata });
  const { emitToUser } = require('./socketService');
  emitToUser(userId, 'notification:new', {
    id: notification.id,
    title,
    message,
    type,
  });
  return notification;
};

module.exports = { getForUser, markRead, markAllRead, createCampaign, notifyUser };
