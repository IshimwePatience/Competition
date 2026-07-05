const authService = require('../services/authService');
const config = require('../config');

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, cookieOptions);
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    setTokenCookie(res, result.token);
    res.status(201).json({ success: true, data: { user: result.user } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setTokenCookie(res, result.token);
    res.json({ success: true, data: { user: result.user } });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ success: true, message: 'Logged out' });
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const result = await authService.listUsers(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const verifyHealthWorker = async (req, res, next) => {
  try {
    const user = await authService.verifyHealthWorker(req.params.id, req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const promoteToHealthWorker = async (req, res, next) => {
  try {
    const user = await authService.promoteToHealthWorker(req.user.id);
    res.json({ success: true, data: user, message: 'Applied for health worker role. Awaiting admin verification.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  listUsers,
  verifyHealthWorker,
  promoteToHealthWorker,
};
