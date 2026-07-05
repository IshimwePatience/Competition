const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const AppError = require('../utils/AppError');

const register = async ({ email, password, firstName, lastName, latitude, longitude, role }) => {
  if (role === 'admin') {
    throw new AppError('Admin accounts cannot be created via registration', 403);
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  if (config.admin.email && email.toLowerCase() === config.admin.email.toLowerCase()) {
    throw new AppError('This email is reserved for the system administrator', 403);
  }

  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    latitude,
    longitude,
    role: 'user',
  });

  const token = generateToken(user);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user);
  return { user, token };
};

const getProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const updateProfile = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);

  const allowed = ['firstName', 'lastName', 'latitude', 'longitude'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) user[key] = data[key];
  });

  await user.save();
  return user;
};

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

const listUsers = async ({ role, page = 1, limit = 20 }) => {
  const where = {};
  if (role) where.role = role;

  const offset = (page - 1) * limit;
  const { rows, count } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { users: rows, total: count, page, limit };
};

const verifyHealthWorker = async (userId, adminId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  if (user.role !== 'health_worker') {
    throw new AppError('User is not a health worker applicant', 400);
  }

  user.isVerified = true;
  await user.save();

  const { Notification } = require('../models');
  const notificationService = require('./notificationService');
  await notificationService.notifyUser(user.id, {
    title: 'Account Verified',
    message: 'Your health worker account has been verified. Your reports now carry extra weight.',
    type: 'system',
  });

  const { emitToUser } = require('./socketService');
  emitToUser(user.id, 'worker:approved', { userId: user.id });

  return user;
};

const promoteToHealthWorker = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);

  user.role = 'health_worker';
  user.isVerified = false;
  await user.save();
  return user;
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  listUsers,
  verifyHealthWorker,
  promoteToHealthWorker,
};
