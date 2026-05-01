import http from 'node:http';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import './config/cloudinary.js';
import { connectDB } from './config/db.js';
import env from './config/env.js';
import { logger } from './config/logger.js';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import {
  globalLimiter,
  inviteLimiter,
  searchLimiter,
  superAdminLimiter,
  uploadLimiter,
} from './middleware/rateLimiters.js';
import { requestId } from './middleware/requestId.js';
import { sanitizeRequest } from './middleware/sanitize.js';
import activityRoutes from './routes/activityRoutes.js';
import authRoutes from './routes/authRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { initSocket } from './services/socketService.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, id: req.id }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(sanitizeRequest);
app.use('/api', globalLimiter);

app.post('/api/invitations', inviteLimiter);
app.use('/api/uploads', uploadLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/super-admin', superAdminLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/super-admin', superAdminRoutes);

const docsEnabled = env.NODE_ENV !== 'production' || env.EXPOSE_DOCS_IN_PROD;
if (docsEnabled) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'SaaS Dashboard API' }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.CLIENT_URL, credentials: true },
});

initSocket(io);

const startServer = async () => {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Server listening');
  });
};

if (env.NODE_ENV !== 'test') {
  startServer();
}

export { app, httpServer, io };
