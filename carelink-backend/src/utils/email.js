const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const emailWhere = (sequelize, email) =>
  sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), normalizeEmail(email));

module.exports = { normalizeEmail, emailWhere };
