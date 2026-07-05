const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Facility, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const { normalizeEmail, emailWhere } = require('../utils/email');

const findByEmail = (email) => User.findOne({ where: emailWhere(sequelize, email) });

const register = async () => {
  throw new AppError(
    'Patient accounts are not available. Use the free symptom checker. Clinics and pharmacies must register a facility account.',
    403
  );
};

const registerFacility = async ({
  email,
  password,
  firstName,
  lastName,
  facilityName,
  facilityType,
  address,
  phone,
  latitude,
  longitude,
  openingHours,
}) => {
  if (!['clinic', 'pharmacy'].includes(facilityType)) {
    throw new AppError('Facility type must be clinic or pharmacy', 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await findByEmail(normalizedEmail);
  if (existing) throw new AppError('Email already registered', 409);

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new AppError('Valid facility location coordinates are required', 400);
  }

  const user = await sequelize.transaction(async (t) => {
    const createdUser = await User.create({
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      latitude: lat,
      longitude: lng,
      role: 'facility',
      isVerified: true,
    }, { transaction: t });

    await Facility.create({
      name: facilityName.trim(),
      type: facilityType,
      address: address.trim(),
      phone: phone?.trim() || null,
      latitude: lat,
      longitude: lng,
      openingHours: openingHours?.trim() || 'Mon-Fri 8:00-17:00',
      ownerId: createdUser.id,
      medicineStock: [],
      isOpen: true,
    }, { transaction: t });

    return createdUser;
  });

  const token = generateToken(user);
  return { user, token };
};

const ALLOWED_LOGIN_ROLES = ['admin', 'facility', 'health_worker'];

const login = async ({ email, password }) => {
  const user = await findByEmail(email);
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!ALLOWED_LOGIN_ROLES.includes(user.role)) {
    throw new AppError('Patient accounts are not required. Use the free symptom checker without logging in.', 403);
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

const loginWithGoogle = async (profile) => {
  const { googleId, email, firstName, lastName, emailVerified } = profile;
  const normalizedEmail = email.toLowerCase();

  let user = await User.findOne({ where: { googleId } });
  if (!user) {
    user = await findByEmail(normalizedEmail);
    if (user) {
      user.googleId = googleId;
      user.authProvider = 'google';
      if (emailVerified) user.emailVerified = true;
      await user.save();
    } else {
      throw new AppError('No account found. Please register your clinic or pharmacy first.', 404);
    }
  }

  const token = generateToken(user);
  return { user, token };
};

module.exports = {
  register,
  registerFacility,
  login,
  loginWithGoogle,
  getProfile,
  updateProfile,
  listUsers,
  verifyHealthWorker,
  promoteToHealthWorker,
};
