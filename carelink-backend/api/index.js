const { sequelize } = require('../src/models');
const app = require('../src/app');
const bootstrapAdmin = require('../src/utils/bootstrapAdmin');

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await sequelize.authenticate();
    await bootstrapAdmin();
    initialized = true;
  }
  return app(req, res);
};
