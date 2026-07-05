const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const app = require('./app');
const config = require('./config');
const { sequelize } = require('./models');
const bootstrapAdmin = require('./utils/bootstrapAdmin');
const socketService = require('./services/socketService');

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: config.nodeEnv === 'development' });
    console.log('Database synced');

    await bootstrapAdmin();

    const server = http.createServer(app);
    socketService.init(server);

    server.listen(config.port, () => {
      console.log(`CareLink API running on http://localhost:${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/api/v1/health`);
      console.log(`WebSocket ready`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
