let io = null;

export const initSocket = (ioInstance) => {
  io = ioInstance;

  io.on('connection', (socket) => {
    socket.emit('socket:ready');
  });
};

export const emitToUser = (userId, event, payload) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToOrg = (orgId, event, payload) => {
  io?.to(`org:${orgId}`).emit(event, payload);
};
