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

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use. Stop the other server first:`);
        console.error(`  netstat -ano | findstr :${config.port}`);
        console.error('  taskkill /PID <pid> /F');
        process.exit(1);
      }
      throw err;
    });

    server.listen(config.port, () => {
      console.log(`CareLink API running on http://localhost:${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/api/v1/health`);
      console.log(`WebSocket ready`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    if (err.errors?.length) {
      err.errors.forEach((e) => console.error(`  - ${e.path}: ${e.message}`));
    }
    process.exit(1);
  }
};

start();
