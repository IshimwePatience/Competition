require('dotenv').config();
const { sequelize } = require('../models');

const reset = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ force: true });
    console.log('Database reset complete (all tables dropped and recreated)');
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

reset();
