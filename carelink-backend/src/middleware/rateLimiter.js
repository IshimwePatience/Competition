const rateLimit = require('express-rate-limit');
const config = require('../config');

const isDev = config.nodeEnv === 'development';

// No rate limiting in local development — dashboard fires many parallel API calls
const noop = (_req, _res, next) => next();

const apiLimiter = isDev
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later' },
    });

const triageLimiter = isDev
  ? noop
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 20,
      message: { success: false, message: 'Triage rate limit exceeded. Try again in an hour.' },
    });

const authLimiter = isDev
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 50,
      message: { success: false, message: 'Too many auth attempts' },
    });

module.exports = { apiLimiter, triageLimiter, authLimiter };
