const config = require('../config');
const { HealthCredit, User, Notification } = require('../models');
const AppError = require('../utils/AppError');

const getBalance = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  return { balance: user.healthCredits };
};

const getHistory = async (userId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await HealthCredit.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { transactions: rows, total: count, page, limit };
};

const recordHealthyAction = async (userId, actionType, description) => {
  const creditMap = {
    checkup: config.credits.checkup,
    blood_donation: config.credits.bloodDonation,
  };

  const amount = creditMap[actionType];
  if (!amount) throw new AppError('Invalid action type', 400);

  const user = await User.findByPk(userId);
  user.healthCredits += amount;
  await user.save();

  const transaction = await HealthCredit.create({
    userId,
    amount,
    type: actionType,
    description: description || `${actionType.replace('_', ' ')} completed`,
  });

  await Notification.create({
    userId,
    title: 'Health Credits Earned',
    message: `You earned ${amount} credits for ${actionType.replace('_', ' ')}!`,
    type: 'credit',
  });

  const { emitToUser } = require('./socketService');
  emitToUser(userId, 'credit:earned', { amount, reason: actionType });

  return { transaction, balance: user.healthCredits };
};

const redeemScreening = async (userId) => {
  const cost = config.credits.screeningCost;
  const user = await User.findByPk(userId);

  if (user.healthCredits < cost) {
    throw new AppError(`Insufficient credits. Need ${cost}, have ${user.healthCredits}`, 400);
  }

  user.healthCredits -= cost;
  await user.save();

  const transaction = await HealthCredit.create({
    userId,
    amount: -cost,
    type: 'redemption',
    description: 'Free health screening redeemed',
  });

  await Notification.create({
    userId,
    title: 'Screening Redeemed',
    message: 'Your free health screening has been redeemed. Visit any partner clinic.',
    type: 'credit',
    metadata: { redemptionCode: `CL-${Date.now().toString(36).toUpperCase()}` },
  });

  return {
    transaction,
    balance: user.healthCredits,
    redemptionCode: transaction.id.slice(0, 8).toUpperCase(),
  };
};

module.exports = {
  getBalance,
  getHistory,
  recordHealthyAction,
  redeemScreening,
};
