const authService = require('../services/authService');
const googleAuthService = require('../services/googleAuthService');
const config = require('../config');

const isProduction = config.nodeEnv === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, cookieOptions);
};

const authPayload = (result) => ({ user: result.user, token: result.token });

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    setTokenCookie(res, result.token);
    res.status(201).json({ success: true, data: authPayload(result) });
  } catch (err) {
    next(err);
  }
};

const registerFacility = async (req, res, next) => {
  try {
    const result = await authService.registerFacility(req.body);
    setTokenCookie(res, result.token);
    res.status(201).json({ success: true, data: authPayload(result) });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setTokenCookie(res, result.token);
    res.json({ success: true, data: authPayload(result) });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
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

const googleRedirect = (req, res, next) => {
  try {
    res.redirect(googleAuthService.getAuthUrl());
  } catch (err) {
    next(err);
  }
};

const googleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.redirect(`${config.clientUrl}/?auth_mode=login&auth_error=${encodeURIComponent(error)}`);
    }
    if (!code) {
      return res.redirect(`${config.clientUrl}/?auth_mode=login&auth_error=${encodeURIComponent('Google sign-in was cancelled')}`);
    }

    const profile = await googleAuthService.exchangeCodeForProfile(code);
    const result = await authService.loginWithGoogle(profile);
    setTokenCookie(res, result.token);
    const token = encodeURIComponent(result.token);
    res.redirect(`${config.clientUrl}/dashboard#token=${token}`);
  } catch (err) {
    const message = err.isOperational ? err.message : 'Google sign-in failed';
    res.redirect(`${config.clientUrl}/?auth_mode=login&auth_error=${encodeURIComponent(message)}`);
  }
};

module.exports = {
  register,
  registerFacility,
  login,
  logout,
  getProfile,
  updateProfile,
  listUsers,
  verifyHealthWorker,
  promoteToHealthWorker,
  googleRedirect,
  googleCallback,
};
