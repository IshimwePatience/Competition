const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) throw new AppError('Authentication required', 401);
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.id);

    if (!user) throw new AppError('User not found', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

module.exports = { authenticate, authorize };
