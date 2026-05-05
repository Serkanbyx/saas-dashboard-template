import http from 'node:http';
import { createRequire } from 'node:module';
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
  superAdminLimiter,
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

const require = createRequire(import.meta.url);
const { version } = require('./package.json');
const projectName = 'SaaS Dashboard Template API';

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

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectName}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111f;
        --panel: rgba(13, 24, 43, 0.82);
        --primary: #38bdf8;
        --secondary: #22c55e;
        --text: #e5f0ff;
        --muted: #92a4bb;
        --line: rgba(148, 163, 184, 0.2);
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        overflow: hidden;
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.2), transparent 28rem),
          radial-gradient(circle at 80% 10%, rgba(34, 197, 94, 0.16), transparent 24rem),
          linear-gradient(135deg, #06101d 0%, #0f172a 54%, #08111f 100%);
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        background:
          linear-gradient(var(--line) 1px, transparent 1px),
          linear-gradient(90deg, var(--line) 1px, transparent 1px);
        background-size: 56px 56px;
        mask-image: radial-gradient(circle at center, black 0%, transparent 72%);
      }

      body::after {
        content: "";
        position: fixed;
        width: min(56vw, 42rem);
        height: min(56vw, 42rem);
        border: 1px solid rgba(56, 189, 248, 0.22);
        border-radius: 42% 58% 62% 38%;
        animation: floatPanel 14s ease-in-out infinite alternate;
      }

      .container {
        position: relative;
        z-index: 1;
        width: min(92vw, 720px);
        padding: clamp(2rem, 6vw, 4rem);
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 32px;
        text-align: center;
        background: var(--panel);
        box-shadow: 0 28px 100px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(24px);
      }

      h1 {
        margin: 0;
        font-size: clamp(2.35rem, 8vw, 5.35rem);
        line-height: 0.95;
        letter-spacing: -0.075em;
        background: linear-gradient(120deg, #f8fbff 8%, var(--primary) 46%, var(--secondary) 92%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: 0 0 34px rgba(56, 189, 248, 0.25);
      }

      .version {
        margin: 1rem 0 2rem;
        color: var(--muted);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .links {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.85rem;
      }

      .links a,
      .sign a {
        color: inherit;
        text-decoration: none;
      }

      .btn-primary,
      .btn-secondary {
        min-width: 11.5rem;
        padding: 0.9rem 1.15rem;
        border-radius: 999px;
        font-weight: 700;
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      }

      .btn-primary {
        color: #03111d;
        background: linear-gradient(135deg, var(--primary), #67e8f9);
        box-shadow: 0 14px 34px rgba(56, 189, 248, 0.28);
      }

      .btn-secondary {
        border: 1px solid rgba(34, 197, 94, 0.42);
        color: #d8ffe7;
        background: rgba(34, 197, 94, 0.1);
      }

      .btn-primary:hover,
      .btn-secondary:hover {
        transform: translateY(-3px);
        box-shadow: 0 18px 44px rgba(34, 197, 94, 0.18);
      }

      footer.sign {
        margin-top: 2.5rem;
        color: var(--muted);
        font-size: 0.95rem;
      }

      footer.sign a {
        color: #7dd3fc;
        font-weight: 700;
      }

      footer.sign a:hover {
        color: #86efac;
      }

      @keyframes floatPanel {
        from {
          transform: translate3d(-12rem, 5rem, 0) rotate(0deg);
        }
        to {
          transform: translate3d(12rem, -5rem, 0) rotate(18deg);
        }
      }

      @media (max-width: 520px) {
        body {
          overflow: auto;
          padding: 1rem;
        }

        .links {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${projectName}</h1>
      <p class="version">v${version}</p>
      <div class="links">
        <a href="/api/docs" class="btn-primary">API Documentation</a>
        <a href="/api/health" class="btn-secondary">Health Check</a>
      </div>
      <footer class="sign">
        Created by
        <a href="https://serkanbayraktar.com/" target="_blank" rel="noopener noreferrer">Serkanby</a>
        |
        <a href="https://github.com/Serkanbyx" target="_blank" rel="noopener noreferrer">Github</a>
      </footer>
    </div>
  </body>
</html>`);
});

const docsEnabled = env.NODE_ENV !== 'production' || env.EXPOSE_DOCS_IN_PROD;
if (docsEnabled) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'SaaS Dashboard API' }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
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
