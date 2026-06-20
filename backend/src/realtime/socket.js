const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/token');
const env = require('../config/env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.clientOrigins, credentials: true } });

  // Authenticate every socket via the same access token.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('unauthorized'));
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch (e) { next(new Error('unauthorized')); }
  });

  io.on('connection', (socket) => {
    // Clients join a room per circle they belong to.
    socket.on('circle:join', (circleId) => socket.join(`circle:${circleId}`));
    socket.on('circle:leave', (circleId) => socket.leave(`circle:${circleId}`));
    // Optional client-driven live location relay (also persisted via REST).
    socket.on('location:update', (data) => {
      if (data && data.circle) io.to(`circle:${data.circle}`).emit('location:update', { ...data, user: socket.userId });
    });
  });
  return io;
}
// Helper used by controllers to broadcast to a circle room.
function emitToCircle(circleId, event, payload) {
  if (io) io.to(`circle:${circleId}`).emit(event, payload);
}
module.exports = { initSocket, emitToCircle, getIO: () => io };
