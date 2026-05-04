import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import env from '../config/env.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';

let io = null;
const userSockets = new Map();

const getSocketToken = (socket) => socket.handshake.auth?.token;

const addUserSocket = (userId, socketId) => {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }

  userSockets.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSockets.delete(userId);
  }
};

export const initSocket = (ioInstance) => {
  io = ioInstance;

  io.use(async (socket, next) => {
    try {
      const token = getSocketToken(socket);

      if (!token || !env.JWT_SECRET) {
        return next(new Error('Unauthorized'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id isActive');

      if (!user?.isActive) {
        return next(new Error('Unauthorized'));
      }

      socket.userId = user._id.toString();
      return next();
    } catch (_error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    addUserSocket(userId, socket.id);

    socket.emit('socket:ready');

    socket.on('join:org', async (orgId) => {
      try {
        if (!mongoose.isValidObjectId(orgId)) {
          return;
        }

        const membership = await Membership.exists({ userId, orgId });
        if (!membership) {
          return;
        }

        socket.join(`org:${orgId}`);
      } catch (_error) {
        return;
      }
    });

    socket.on('leave:org', (orgId) => {
      socket.leave(`org:${orgId}`);
    });

    socket.on('disconnect', () => {
      removeUserSocket(userId, socket.id);
    });
  });
};

export const emitToUser = (userId, event, payload) => {
  const socketIds = [...(userSockets.get(userId?.toString()) || [])];
  if (socketIds.length === 0) return;

  io?.to(socketIds).emit(event, payload);
};

export const emitToOrg = (orgId, event, payload) => {
  io?.to(`org:${orgId}`).emit(event, payload);
};
