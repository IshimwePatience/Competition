const { authenticate, authorize } = require('./auth');

const requireAuth = authenticate;

const requireRole = (...roles) => [authenticate, authorize(...roles)];

module.exports = { requireAuth, requireRole, authenticate, authorize };
