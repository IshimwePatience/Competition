const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const config = require('../config');
const { User } = require('../models');

let io = null;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/token=([^;]+)/)?.[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findByPk(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => io;

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

const emitToRole = (role, event, data) => {
  if (io) io.to(`role:${role}`).emit(event, data);
};

const broadcast = (event, data) => {
  if (io) io.emit(event, data);
};

module.exports = { init, getIO, emitToUser, emitToRole, broadcast };
