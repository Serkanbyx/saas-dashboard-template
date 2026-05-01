# SaaS Dashboard Template — Step-by-Step Build Guide

> **Project Summary:**
> A production-ready, multi-tenant SaaS starter template where users can create organizations, invite team members via email with UUID tokens, and operate within isolated workspaces. The system enforces a four-tier role hierarchy (Super Admin → Owner → Admin → Member) with strict RBAC, includes a hybrid analytics dashboard (real member/activity data + mock revenue/growth charts via Recharts), Cloudinary-powered logo/avatar uploads, real-time notifications through Socket.io, a mock subscription system (free/pro plans) with billing history, a team activity feed, branded HTML email templates, light/dark theming, a global command-palette search, OpenAPI documentation, structured logging, error boundaries, automated tests, and a CI pipeline. Built on the modern MERN stack (React 19 + Vite, Express 5, Mongoose 9) with deep security hardening — JWT auth, helmet, rate limiting, NoSQL injection protection, mass-assignment guards, and tenant-isolation middleware on every query.

> Each step below is a self-contained prompt. Execute them in order.
> Stack: React 19 + Vite, Node/Express 5, MongoDB/Mongoose 9, JWT, Nodemailer, Cloudinary, Socket.io, TailwindCSS v4, React Router v7, Recharts, Axios, Pino (logging), swagger-jsdoc, Vitest, Supertest, React Testing Library, GitHub Actions.

---

## Public Repository Posture (read first)

This project is intended to be published to a **public GitHub repository** (manually, via GitHub Desktop). Every step below is written with that constraint in mind. The non-negotiable rules:

1. **No real secrets in source code, ever.** Not in `.env` (gitignored), not in seed scripts, not in tests, not in comments, not in commit history. The only env file ever pushed to GitHub is `.env.example` with placeholder values.
2. **No real personal data in seeds, fixtures, or sample data.** Use generic names (`Demo Owner`, `demo@example.com`) — never your own email, your friends' emails, or production-like data.
3. **No hardcoded URLs, IDs, tokens, or API keys** anywhere in the codebase. Everything sensitive flows through `process.env` (server) or `import.meta.env` (client).
4. **No internal infrastructure details exposed** in code, comments, or error messages — no internal hostnames, no IP addresses, no Render/Netlify project IDs, no MongoDB Atlas cluster names.
5. **No commented-out code containing secrets** ("just for testing"). Strip all such blocks before publishing.
6. **No `console.log` of `req.body`, `req.headers`, `req.user`, tokens, env vars, or password hashes** anywhere in the source.
7. **No screenshots or media containing real data** in the README or `docs/` folder. Use redacted/demo screenshots only.
8. **No CI workflow files (`.github/workflows/*.yml`) that print secrets** to logs (e.g. `echo $JWT_SECRET`). Use GitHub Actions secrets and never echo them.
9. **`.gitignore` is the last line of defense** — but never the first. Treat every file in the repo as if it will be read by adversaries the moment it is published, because it will be (GitHub search indexes public repos within minutes).
10. **Run a final pre-publish audit** (STEP 44) right before clicking "Publish repository" in GitHub Desktop. Once a secret hits a public repo, **rotate it immediately** — assume it is compromised even if you delete the commit afterward.

These rules are reinforced in every relevant step below and consolidated in the final pre-publish checklist (STEP 44).

---

## Table of Contents

**PHASE 1 — Backend Foundation**
- [STEP 1 — Project Scaffolding & Dependency Setup](#step-1--project-scaffolding--dependency-setup)
- [STEP 2 — Environment Configuration & Database Connection](#step-2--environment-configuration--database-connection)
- [STEP 3 — User Model, Auth System & Super Admin Seed](#step-3--user-model-auth-system--super-admin-seed)

**PHASE 2 — Multi-Tenancy & Core Resources**
- [STEP 4 — Organization Model & Tenant-Isolation Middleware](#step-4--organization-model--tenant-isolation-middleware)
- [STEP 5 — Membership Model & RBAC Middleware](#step-5--membership-model--rbac-middleware)
- [STEP 6 — Invitation Model & API](#step-6--invitation-model--api)
- [STEP 7 — Email Template System (HTML)](#step-7--email-template-system-html)
- [STEP 8 — Members Management Aggregate API](#step-8--members-management-aggregate-api)
- [STEP 9 — Cloudinary Upload Integration](#step-9--cloudinary-upload-integration)
- [STEP 10 — Activity Log Model & Tracking System](#step-10--activity-log-model--tracking-system)
- [STEP 11 — Mock Billing System & Plan Management](#step-11--mock-billing-system--plan-management)
- [STEP 12 — Notification Model & Socket.io Real-Time Layer](#step-12--notification-model--socketio-real-time-layer)
- [STEP 13 — Dashboard Metrics API (Hybrid)](#step-13--dashboard-metrics-api-hybrid)
- [STEP 14 — Search API & Global Filters](#step-14--search-api--global-filters)

**PHASE 3 — Platform, Quality & Security**
- [STEP 15 — Super Admin API](#step-15--super-admin-api)
- [STEP 16 — API Documentation (Swagger / OpenAPI)](#step-16--api-documentation-swagger--openapi)
- [STEP 17 — Logging & Production Observability](#step-17--logging--production-observability)
- [STEP 18 — Backend Request Validators](#step-18--backend-request-validators)
- [STEP 19 — Comprehensive Security Audit](#step-19--comprehensive-security-audit)

**PHASE 4 — Client Foundation**
- [STEP 20 — Client Setup: Vite, Tailwind, Axios, Services](#step-20--client-setup-vite-tailwind-axios-services)
- [STEP 21 — Client State: Contexts (Auth, Org, Socket, Notification)](#step-21--client-state-contexts-auth-org-socket-notification)
- [STEP 22 — Theme System (Light / Dark / System)](#step-22--theme-system-light--dark--system)
- [STEP 23 — React Error Boundaries & Global Error UX](#step-23--react-error-boundaries--global-error-ux)
- [STEP 24 — Layouts (Auth, Org, Admin)](#step-24--layouts-auth-org-admin)
- [STEP 25 — Routing & Route Guards](#step-25--routing--route-guards)

**PHASE 5 — Client Pages**
- [STEP 26 — Auth Pages & Org Creation Wizard](#step-26--auth-pages--org-creation-wizard)
- [STEP 27 — First-Run Onboarding Flow](#step-27--first-run-onboarding-flow)
- [STEP 28 — Invitation Accept Page](#step-28--invitation-accept-page)
- [STEP 29 — Dashboard Page (KPIs + Recharts)](#step-29--dashboard-page-kpis--recharts)
- [STEP 30 — Members Page](#step-30--members-page)
- [STEP 31 — Team Activity Page](#step-31--team-activity-page)
- [STEP 32 — Billing & Plan Page](#step-32--billing--plan-page)
- [STEP 33 — Org Settings Page](#step-33--org-settings-page)
- [STEP 34 — Account Settings Page](#step-34--account-settings-page)
- [STEP 35 — Notifications UI (Bell + Toast)](#step-35--notifications-ui-bell--toast)
- [STEP 36 — Global Search Command Palette](#step-36--global-search-command-palette)
- [STEP 37 — Super Admin Pages](#step-37--super-admin-pages)

**PHASE 6 — Polish, Quality & Deploy**
- [STEP 38 — UX Enhancements & Reusable Components](#step-38--ux-enhancements--reusable-components)
- [STEP 39 — 404, Route Guards & Org Switcher Refinement](#step-39--404-route-guards--org-switcher-refinement)
- [STEP 40 — Performance Optimization & Code Splitting](#step-40--performance-optimization--code-splitting)
- [STEP 41 — Testing Setup (Vitest + Supertest + RTL)](#step-41--testing-setup-vitest--supertest--rtl)
- [STEP 42 — CI/CD with GitHub Actions](#step-42--cicd-with-github-actions)
- [STEP 43 — README & Documentation](#step-43--readme--documentation)
- [STEP 44 — Code Cleanup & Pre-Publish (Public GitHub) Audit](#step-44--code-cleanup--pre-publish-public-github-audit)
- [STEP 45 — Deployment (Render + Netlify + Cloudinary)](#step-45--deployment-render--netlify--cloudinary)

---

## STEP 1 — Project Scaffolding & Dependency Setup

Create the root project directory `saas-dashboard-template/` containing two sibling folders: `server/` and `client/`. Initialize them as separate npm workspaces (no monorepo tooling needed — keep package.json files independent).

### Server folder structure (`server/`)

```
server/
├── config/
│   ├── db.js
│   ├── env.js
│   ├── cloudinary.js
│   ├── logger.js
│   └── swagger.js
├── controllers/
│   ├── authController.js
│   ├── organizationController.js
│   ├── membershipController.js
│   ├── invitationController.js
│   ├── activityController.js
│   ├── billingController.js
│   ├── notificationController.js
│   ├── dashboardController.js
│   ├── searchController.js
│   ├── uploadController.js
│   └── superAdminController.js
├── middleware/
│   ├── auth.js
│   ├── tenant.js
│   ├── rbac.js
│   ├── upload.js
│   ├── rateLimiters.js
│   ├── sanitize.js
│   ├── validate.js
│   ├── requestId.js
│   └── errorHandler.js
├── models/
│   ├── User.js
│   ├── Organization.js
│   ├── Membership.js
│   ├── Invitation.js
│   ├── ActivityLog.js
│   ├── BillingRecord.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── organizationRoutes.js
│   ├── membershipRoutes.js
│   ├── invitationRoutes.js
│   ├── activityRoutes.js
│   ├── billingRoutes.js
│   ├── notificationRoutes.js
│   ├── dashboardRoutes.js
│   ├── searchRoutes.js
│   ├── uploadRoutes.js
│   └── superAdminRoutes.js
├── services/
│   ├── emailService.js
│   ├── socketService.js
│   └── activityService.js
├── templates/
│   └── emails/
│       ├── _base.html
│       ├── invitation.html
│       ├── welcome.html
│       ├── role-changed.html
│       ├── plan-changed.html
│       └── org-suspended.html
├── tests/
│   ├── setup.js
│   ├── helpers.js
│   ├── auth.test.js
│   ├── tenant.test.js
│   └── invitations.test.js
├── utils/
│   ├── generateToken.js
│   ├── escapeRegex.js
│   ├── generateSlug.js
│   ├── generateInvoiceNumber.js
│   ├── pagination.js
│   ├── renderEmail.js
│   └── constants.js
├── validators/
│   ├── authValidators.js
│   ├── organizationValidators.js
│   ├── membershipValidators.js
│   ├── invitationValidators.js
│   ├── billingValidators.js
│   └── searchValidators.js
├── seed/
│   └── seedSuperAdmin.js
├── .env.example
├── .gitignore
├── package.json
└── index.js
```

### Client folder structure (`client/`)

```
client/
├── public/
├── src/
│   ├── api/
│   │   └── axiosInstance.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Spinner.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ErrorFallback.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── RoleBadge.jsx
│   │   │   ├── PlanBadge.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── Pagination.jsx
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── OrgSwitcher.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── UserMenu.jsx
│   │   │   ├── CommandPalette.jsx
│   │   │   └── Footer.jsx
│   │   ├── dashboard/
│   │   │   ├── KpiCard.jsx
│   │   │   ├── ActiveUsersChart.jsx
│   │   │   ├── GrowthChart.jsx
│   │   │   ├── RevenueChart.jsx
│   │   │   └── RecentActivityWidget.jsx
│   │   ├── members/
│   │   │   ├── MembersTable.jsx
│   │   │   ├── InviteMemberModal.jsx
│   │   │   └── ChangeRoleDropdown.jsx
│   │   ├── billing/
│   │   │   ├── PlanCard.jsx
│   │   │   └── BillingHistoryTable.jsx
│   │   └── onboarding/
│   │       └── OnboardingWizard.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── OrgContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── NotificationContext.jsx
│   │   └── SocketContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useOrg.js
│   │   ├── useTheme.js
│   │   ├── useSocket.js
│   │   ├── useDebounce.js
│   │   ├── useHotkey.js
│   │   └── useLocalStorage.js
│   ├── layouts/
│   │   ├── AuthLayout.jsx
│   │   ├── OrgLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── CreateOrgPage.jsx
│   │   ├── invite/
│   │   │   └── AcceptInvitePage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx
│   │   ├── members/
│   │   │   └── MembersPage.jsx
│   │   ├── activity/
│   │   │   └── ActivityPage.jsx
│   │   ├── billing/
│   │   │   └── BillingPage.jsx
│   │   ├── settings/
│   │   │   ├── OrgSettingsPage.jsx
│   │   │   └── AccountSettingsPage.jsx
│   │   ├── superadmin/
│   │   │   ├── SuperAdminDashboardPage.jsx
│   │   │   ├── AllOrgsPage.jsx
│   │   │   └── AllUsersPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── routes/
│   │   ├── ProtectedRoute.jsx
│   │   ├── OrgRoleRoute.jsx
│   │   ├── SuperAdminRoute.jsx
│   │   └── GuestOnlyRoute.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── organizationService.js
│   │   ├── membershipService.js
│   │   ├── invitationService.js
│   │   ├── activityService.js
│   │   ├── billingService.js
│   │   ├── notificationService.js
│   │   ├── dashboardService.js
│   │   ├── searchService.js
│   │   ├── uploadService.js
│   │   └── superAdminService.js
│   ├── tests/
│   │   ├── setup.js
│   │   └── components/
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── formatCurrency.js
│   │   ├── permissions.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

### Server dependencies

| Package | Purpose |
|---|---|
| `express@^5` | HTTP framework |
| `mongoose@^9` | ODM for MongoDB |
| `dotenv` | Env loader |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT auth |
| `cors` | CORS handling |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting |
| `express-mongo-sanitize` | NoSQL injection protection (used via `.sanitize()` only) |
| `express-validator` | Request validation |
| `nodemailer` | Email sending |
| `uuid` | Token generation for invitations |
| `cloudinary` | Image uploads |
| `multer` | Multipart parsing |
| `multer-storage-cloudinary` | Cloudinary storage adapter |
| `slugify` | Slug generation |
| `socket.io` | Real-time WebSocket layer |
| `pino` | Structured logger |
| `pino-http` | HTTP request logger |
| `swagger-jsdoc` | OpenAPI generation from JSDoc |
| `swagger-ui-express` | Swagger UI |

### Server dev dependencies

| Package | Purpose |
|---|---|
| `nodemon` | Hot reload |
| `vitest` | Test runner |
| `supertest` | HTTP integration testing |
| `mongodb-memory-server` | In-memory MongoDB for tests |
| `pino-pretty` | Pretty log output in dev |

### Server npm scripts (`server/package.json`)

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js | pino-pretty",
    "start": "node index.js",
    "seed:admin": "node seed/seedSuperAdmin.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview:emails": "node scripts/previewEmails.js"
  }
}
```

### Client dependencies

| Package | Purpose |
|---|---|
| `react@^19` | UI library |
| `react-dom@^19` | DOM bindings |
| `react-router-dom@^7` | Client routing |
| `axios` | HTTP client |
| `recharts` | Charting |
| `react-hot-toast` | Toast notifications |
| `lucide-react` | Icon set |
| `socket.io-client` | Real-time client |
| `clsx` | Conditional classNames |
| `date-fns` | Date formatting |

### Client dev dependencies

| Package | Purpose |
|---|---|
| `vite` | Build tool |
| `@vitejs/plugin-react` | React plugin |
| `tailwindcss@^4` | Styling (v4) |
| `@tailwindcss/vite` | Tailwind v4 Vite plugin |
| `vitest` | Test runner |
| `@testing-library/react` | Component tests |
| `@testing-library/jest-dom` | Test matchers |
| `@testing-library/user-event` | User interaction sim |
| `jsdom` | DOM env for vitest |

### Client npm scripts (`client/package.json`)

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Root `.gitignore`

This file is **critical** for a public repository. It must catch every flavour of env file, build output, local IDE config, OS metadata, and runtime artifact before anything is staged.

```
# Dependencies
node_modules/

# Env files — NEVER commit any of these to a public repo
.env
.env.*
!.env.example
*.env

# Build output
dist/
build/
client/dist/

# Local uploads (production uses Cloudinary)
uploads/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*

# Coverage / test output
coverage/
.nyc_output/

# OS / Editor
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp

# Misc
.cache/
.tmp/
*.pem
*.key
*.crt
```

The `!.env.example` line is intentional: it re-allows `.env.example` (the placeholder template) to be tracked while keeping every other `.env*` variant out. Never remove this exclusion.

**SECURITY:** Verify `.env` and any future secret files are listed in `.gitignore` before publishing the project to any remote (e.g. via GitHub Desktop). Audit the project root after every dependency install to ensure no `node_modules/` or `.env` is accidentally included.

> **Important — No git commands during development.** This guide does NOT include or run any git CLI commands (`git init`, `git add`, `git commit`, `git push`, etc.). The project stays fully local while you build it. When you are ready to share or deploy, use **GitHub Desktop** (or any GUI tool you prefer) to publish the repository manually. The `.gitignore` file is created as a regular file so it is in place whenever you decide to put the project under version control.

---

## STEP 2 — Environment Configuration & Database Connection

Create the central environment config (`server/config/env.js`) that reads `process.env` with safe defaults and validates production-critical secrets at startup. Build the MongoDB connection (`server/config/db.js`) as an async `connectDB` function that connects via `mongoose.connect(MONGO_URI)`, logs the host on success, and exits the process on failure. Build the Cloudinary config (`server/config/cloudinary.js`) that calls `cloudinary.v2.config({ cloud_name, api_key, api_secret })` from env vars.

### `server/config/env.js` — exported variables

| Variable | Default | Required in production |
|---|---|---|
| `PORT` | `5000` | No |
| `NODE_ENV` | `development` | Yes |
| `MONGO_URI` | — | Yes |
| `JWT_SECRET` | — | Yes (min 32 chars enforced) |
| `JWT_EXPIRES_IN` | `7d` | No |
| `CLIENT_URL` | `http://localhost:5173` | Yes (used for CORS + invite links) |
| `CLOUDINARY_CLOUD_NAME` | — | Yes |
| `CLOUDINARY_API_KEY` | — | Yes |
| `CLOUDINARY_API_SECRET` | — | Yes |
| `EMAIL_HOST` | — | Yes |
| `EMAIL_PORT` | `587` | No |
| `EMAIL_USER` | — | Yes |
| `EMAIL_PASS` | — | Yes (app password) |
| `EMAIL_FROM` | `"SaaS Dashboard <noreply@saas.app>"` | Yes |
| `LOG_LEVEL` | `info` | No (use `debug` in dev, `info` in prod) |
| `EXPOSE_DOCS_IN_PROD` | `false` | No (only `true` if /api/docs intentionally public) |
| `SUPER_ADMIN_EMAIL` | — | Yes (for seed script) |
| `SUPER_ADMIN_PASSWORD` | — | Yes (for seed script) |

At the bottom of `env.js`, run a startup check: if `NODE_ENV === 'production'` and `JWT_SECRET.length < 32`, `console.error` and `process.exit(1)`. Do the same for missing `MONGO_URI` and `CLIENT_URL`.

### `server/index.js` — entry point structure

Middleware order is critical. Apply in this exact sequence:

1. `app.disable('x-powered-by')`
2. `helmet()` with default config
3. `cors({ origin: env.CLIENT_URL, credentials: true })` — never `*` in production
4. `requestId` middleware (assigns a UUID to `req.id` — see STEP 17)
5. `pino-http` request logger (see STEP 17)
6. `express.json({ limit: '10kb' })`
7. `express.urlencoded({ extended: true, limit: '10kb' })`
8. **Custom mongo-sanitize middleware** (see snippet below)
9. Global rate limiter
10. Routes mounted at `/api/auth`, `/api/organizations`, `/api/memberships`, `/api/invitations`, `/api/activities`, `/api/billing`, `/api/notifications`, `/api/dashboard`, `/api/search`, `/api/uploads`, `/api/super-admin`
11. Swagger UI mounted at `/api/docs` (configurable — see STEP 16)
12. Health check: `GET /api/health` returns `{ status: 'ok', timestamp }`
13. 404 fallback: `{ success: false, message: 'Route not found' }`
14. Global `errorHandler` middleware (last)

### Express 5 critical sanitize pattern

Express 5 makes `req.query` a read-only getter. The default `mongoSanitize()` middleware crashes the server because it reassigns `req.query`. Use this custom middleware in `server/middleware/sanitize.js`:

```js
import mongoSanitize from 'express-mongo-sanitize';

export const sanitizeRequest = (req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
};
```

Do **not** install or use `hpp` — it has the same `req.query` reassignment crash in Express 5.

### Rate limiters (`server/middleware/rateLimiters.js`)

Define separate `express-rate-limit` instances exported by name:

| Limiter | Window | Max requests | Mounted on |
|---|---|---|---|
| `globalLimiter` | 15 min | 300 | All `/api/*` routes |
| `authLimiter` | 15 min | 10 | `/api/auth/login`, `/api/auth/register` |
| `inviteLimiter` | 1 hour | 20 | `/api/invitations` (POST) |
| `uploadLimiter` | 1 hour | 30 | `/api/uploads/*` |
| `searchLimiter` | 1 min | 60 | `/api/search` |
| `superAdminLimiter` | 15 min | 100 | `/api/super-admin/*` |

Each limiter must use `standardHeaders: true`, `legacyHeaders: false`, and a clear `message: { success: false, message: 'Too many requests, please try again later.' }`.

### HTTP server + Socket.io bootstrapping

Wrap the Express app in `http.createServer(app)`. Initialize Socket.io with `new Server(httpServer, { cors: { origin: env.CLIENT_URL, credentials: true } })`. Pass the `io` instance to `services/socketService.js` for setup (configured fully in STEP 12). Listen on `env.PORT`.

### `.env.example` (the ONLY env file pushed to the public repo)

Include every variable from the env table above with **clearly fake placeholder values**. The file must be safe for the entire internet to read. Use this exact pattern:

```bash
# Server config
PORT=5000
NODE_ENV=development

# Database — replace with your MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority

# JWT — generate with: openssl rand -base64 48 (must be 32+ chars)
JWT_SECRET=replace-this-with-a-long-random-secret-32-chars-min
JWT_EXPIRES_IN=7d

# Client URL (used for CORS and invite links)
CLIENT_URL=http://localhost:5173

# Cloudinary — get from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMTP — Mailtrap for dev, Resend/Postmark/SendGrid for prod
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_FROM="SaaS Dashboard <noreply@example.com>"

# Logging
LOG_LEVEL=debug

# Docs visibility (true exposes /api/docs in production — keep false unless intentional)
EXPOSE_DOCS_IN_PROD=false

# Super admin seed (used only by `npm run seed:admin`, then rotate)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=replace-with-strong-password-then-rotate
```

**SECURITY — Public Repository Rules for Env Files:**
- The real `.env` file is in `.gitignore` and **must never** be staged in GitHub Desktop.
- `.env.example` placeholder values must be **obviously fake**. Never use a real-looking 48-char base64 string as the example `JWT_SECRET` — use literal text like `replace-this-with-a-long-random-secret-32-chars-min`.
- `process.env.JWT_SECRET` must have **no fallback default value** in code — fail fast if missing.
- Never commit a `.env.local`, `.env.development`, `.env.production`, or any other env variant.
- Do not paste your real `MONGO_URI`, Cloudinary keys, or SMTP password into chat, issues, PRs, or commit messages.
- Production secret length validation prevents weak JWTs.
- CORS `origin` is bound to a specific URL — wildcards forbidden.
- Body size limit (10 KB) prevents DoS via large payloads.
- `x-powered-by` header disabled.
- `express-mongo-sanitize` applied via custom middleware to avoid the Express 5 crash.
- Helmet provides default CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

---

## STEP 3 — User Model, Auth System & Super Admin Seed

Build the `User` model (`server/models/User.js`) representing platform-level identity. A User is independent of any organization — they may belong to zero, one, or many orgs via Memberships (covered in STEP 5).

### User schema fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | String | Yes | — | trim, min 2, max 60 |
| `email` | String | Yes | — | trim, lowercase, unique, valid email format |
| `password` | String | Yes | — | min 8, `select: false` |
| `avatar` | String | No | `''` | URL string (Cloudinary) |
| `platformRole` | String | Yes | `'user'` | enum: `['user', 'superadmin']` |
| `isActive` | Boolean | Yes | `true` | — |
| `hasCompletedOnboarding` | Boolean | Yes | `false` | flipped after first-run wizard (STEP 27) |
| `lastLoginAt` | Date | No | — | — |
| `createdAt` / `updatedAt` | Date | auto | `Date.now` | (via `timestamps: true`) |

### Pre-save password hash hook (Mongoose 9 syntax)

Mongoose 9 removed `next()` support in middleware. Use this exact pattern:

```js
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});
```

### Instance methods

- `comparePassword(plainPassword)` → returns `bcrypt.compare(plainPassword, this.password)`.

### `utils/generateToken.js`

Exports `generateToken(userId)` returning `jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })`.

### Auth middleware (`server/middleware/auth.js`)

| Middleware | Behavior |
|---|---|
| `protect` | Reads `Authorization: Bearer <token>` header, verifies JWT, fetches user (without password), attaches to `req.user`, rejects with 401 if missing/invalid/inactive. |
| `optionalAuth` | Same as `protect` but does not reject — sets `req.user = null` on failure. |
| `superAdminOnly` | Requires `req.user.platformRole === 'superadmin'`, else 403. |

### Auth controller (`server/controllers/authController.js`)

Each function uses try/catch + `next(error)` and responds with `{ success, data?, message? }`.

| Function | Method | Path | Body / Params | Behavior |
|---|---|---|---|---|
| `register` | POST | `/api/auth/register` | `{ name, email, password }` | Mass-assignment safe: explicitly destructure `name, email, password` only. Reject duplicate email with generic `"Registration failed"`. Hash via pre-save hook. Return user (no password) + token. |
| `login` | POST | `/api/auth/login` | `{ email, password }` | Find user by email + `.select('+password')`. If not found OR password mismatch → return `"Invalid email or password"` (identical message). Update `lastLoginAt`. Return user + token. |
| `getMe` | GET | `/api/auth/me` | — | `protect`. Return `req.user`. |
| `updateProfile` | PATCH | `/api/auth/me` | `{ name?, avatar? }` | `protect`. Whitelist `name, avatar` only. Reject any attempt to set `email`, `password`, `platformRole`, `isActive`. |
| `changePassword` | PATCH | `/api/auth/me/password` | `{ currentPassword, newPassword }` | `protect`. Verify current password first. Reject if wrong. Update + re-hash via pre-save. |
| `completeOnboarding` | POST | `/api/auth/me/complete-onboarding` | — | `protect`. Sets `hasCompletedOnboarding = true`. Idempotent. |
| `deleteAccount` | DELETE | `/api/auth/me` | `{ password }` | `protect`. Verify password. Cascade: delete all `Memberships` where `userId === req.user._id`, transfer ownership of orgs they own (if any other admin exists) OR delete the org if they are the sole member, delete `Invitations` they sent. |

### Auth routes (`server/routes/authRoutes.js`)

```
POST   /api/auth/register                      → authLimiter, validate, register
POST   /api/auth/login                         → authLimiter, validate, login
GET    /api/auth/me                            → protect, getMe
PATCH  /api/auth/me                            → protect, validate, updateProfile
PATCH  /api/auth/me/password                   → protect, validate, changePassword
POST   /api/auth/me/complete-onboarding        → protect, completeOnboarding
DELETE /api/auth/me                            → protect, validate, deleteAccount
```

### Error handler (`server/middleware/errorHandler.js`)

Reads `err.statusCode || 500`. In production, returns `{ success: false, message: err.message || 'Server error' }` — no stack trace, no Mongoose field names, no internal paths. In development, includes `stack`. Logs the error server-side via the structured logger (STEP 17).

### Super admin seed (`server/seed/seedSuperAdmin.js`)

Standalone Node script that:
1. Loads `.env`, calls `connectDB()`.
2. Reads `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` from env.
3. Checks if a user with this email exists. If yes, sets `platformRole: 'superadmin'` and exits. If no, creates a new User with `platformRole: 'superadmin'` and `name: 'Super Admin'`.
4. Logs the result and `process.exit(0)`.

Run with `npm run seed:admin`.

**SECURITY:**
- Mass assignment blocked: `register` and `updateProfile` never spread `req.body`.
- `platformRole` is **never** settable via any public API — only via the seed script or super-admin endpoints (STEP 15).
- User enumeration prevented: identical error for unknown email vs wrong password.
- Password hashed with bcrypt rounds 12, marked `select: false`, never returned in responses.
- Password change requires current password verification.
- Account deletion requires password confirmation + cascades all related data.
- Inactive users (`isActive: false`) are blocked by `protect` middleware.
- JWT secret length validated at startup (≥ 32 chars in production).
- Mongoose 9 pre-save hook uses the new `async function()` syntax — no `next` parameter.

---

## STEP 4 — Organization Model & Tenant-Isolation Middleware

The Organization is the **core tenant boundary**. Every piece of business data (members, invitations, activity logs, billing records, notifications) is scoped to exactly one organization. The tenant-isolation middleware enforces this on every request.

### Organization schema (`server/models/Organization.js`)

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | String | Yes | — | trim, min 2, max 80 |
| `slug` | String | Yes | — | unique, lowercase, indexed, generated from name via `slugify` + uniqueness suffix |
| `logo` | String | No | `''` | Cloudinary URL |
| `description` | String | No | `''` | max 500 |
| `plan` | String | Yes | `'free'` | enum: `['free', 'pro']` |
| `planUpdatedAt` | Date | No | — | — |
| `ownerId` | ObjectId | Yes | — | ref: `User` |
| `seatsUsed` | Number | Yes | `1` | min 0 (incremented on accept invite) |
| `seatLimit` | Number | Yes | `5` | (free=5, pro=50 — enforced on plan change) |
| `isDeleted` | Boolean | Yes | `false` | soft delete flag |
| `deletedAt` | Date | No | — | — |
| `createdAt` / `updatedAt` | Date | auto | — | — |

### Indexes

- `{ slug: 1 }` unique
- `{ ownerId: 1 }`
- `{ isDeleted: 1, createdAt: -1 }` (for super admin listings)

### Slug generation utility (`server/utils/generateSlug.js`)

```js
import slugify from 'slugify';
import Organization from '../models/Organization.js';

export const generateUniqueSlug = async (name) => {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  while (await Organization.findOne({ slug })) slug = `${base}-${counter++}`;
  return slug;
};
```

### Organization controller (`server/controllers/organizationController.js`)

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `createOrg` | POST | `/api/organizations` | `protect` | Whitelist `{ name, description, logo }` only. Generate slug. Create org with `ownerId = req.user._id`, `plan: 'free'`, `seatsUsed: 1`, `seatLimit: 5`. **Atomically create** a `Membership` with `role: 'owner'` for the creator. Log activity. Return org. |
| `getMyOrgs` | GET | `/api/organizations/mine` | `protect` | Find all `Memberships` for `req.user._id`, populate `orgId`, return list of orgs the user belongs to (excluding `isDeleted`). Each item includes the user's role. |
| `getOrgById` | GET | `/api/organizations/:orgId` | `protect`, `tenantContext` | Returns `req.org`. |
| `updateOrg` | PATCH | `/api/organizations/:orgId` | `protect`, `tenantContext`, `requireOrgRole(['owner', 'admin'])` | Whitelist `{ name, description, logo }`. Log activity. |
| `deleteOrg` | DELETE | `/api/organizations/:orgId` | `protect`, `tenantContext`, `requireOrgRole(['owner'])` | Owner only. Body must include `{ confirmName: <orgName> }`. Soft delete: `isDeleted: true`, `deletedAt: now`. Cascade: delete `Memberships`, `Invitations`, `Notifications`. Mark `ActivityLog` and `BillingRecord` archived. |

### Tenant-isolation middleware (`server/middleware/tenant.js`)

This is **the most security-critical middleware** in the application. It must be applied to every route that operates on org-scoped data.

**Behavior:**
1. Reads org identifier from URL param `:orgId` (preferred) or header `x-org-id` (fallback).
2. Validates it is a valid Mongoose ObjectId.
3. Loads the `Organization` document, ensures `!org.isDeleted`.
4. Looks up the user's `Membership` for this org. If none → 403.
5. Attaches `req.org`, `req.orgId`, and `req.membership`.
6. **Super admin bypass:** If `req.user.platformRole === 'superadmin'`, skip membership check and synthesize `req.membership = { role: 'owner' }`.

```js
export const tenantContext = async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.headers['x-org-id'];
    if (!orgId || !mongoose.isValidObjectId(orgId)) {
      return res.status(400).json({ success: false, message: 'Invalid organization context' });
    }
    const org = await Organization.findOne({ _id: orgId, isDeleted: false });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    if (req.user.platformRole === 'superadmin') {
      req.org = org; req.orgId = org._id; req.membership = { role: 'owner' };
      return next();
    }
    const membership = await Membership.findOne({ userId: req.user._id, orgId: org._id });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member of this organization' });

    req.org = org; req.orgId = org._id; req.membership = membership;
    next();
  } catch (err) { next(err); }
};
```

### Organization routes (`server/routes/organizationRoutes.js`)

```
POST   /api/organizations              → protect, validate, createOrg
GET    /api/organizations/mine         → protect, getMyOrgs
GET    /api/organizations/:orgId       → protect, tenantContext, getOrgById
PATCH  /api/organizations/:orgId       → protect, tenantContext, requireOrgRole(['owner','admin']), validate, updateOrg
DELETE /api/organizations/:orgId       → protect, tenantContext, requireOrgRole(['owner']), validate, deleteOrg
```

**SECURITY:**
- Tenant isolation enforced server-side on every request.
- `ownerId` is set from `req.user._id` server-side, never from the body.
- `plan`, `seatsUsed`, `seatLimit` are never settable via the public update endpoint.
- Org deletion requires name confirmation in the body.
- Soft delete preserves audit trail; hard delete only available to super admin.
- Super admin bypass is explicit and intentional — logged as an audit event.

---

## STEP 5 — Membership Model & RBAC Middleware

The `Membership` model is the join table between Users and Organizations, carrying the role the user holds within that specific org. A user can have different roles in different orgs.

### Membership schema (`server/models/Membership.js`)

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `userId` | ObjectId | Yes | — | ref: `User`, indexed |
| `orgId` | ObjectId | Yes | — | ref: `Organization`, indexed |
| `role` | String | Yes | `'member'` | enum: `['owner', 'admin', 'member']` |
| `joinedAt` | Date | Yes | `Date.now` | — |
| `invitedBy` | ObjectId | No | — | ref: `User` |

### Indexes

- `{ userId: 1, orgId: 1 }` **unique compound** (prevents duplicate memberships)
- `{ orgId: 1, role: 1 }` (efficient role lookups)

### Role permission matrix (`server/utils/constants.js`)

```js
export const ORG_ROLES = ['owner', 'admin', 'member'];

export const PERMISSIONS = {
  'org:read':         ['owner', 'admin', 'member'],
  'org:update':       ['owner', 'admin'],
  'org:delete':       ['owner'],
  'org:billing':      ['owner'],
  'members:read':     ['owner', 'admin', 'member'],
  'members:invite':   ['owner', 'admin'],
  'members:update':   ['owner', 'admin'],
  'members:remove':   ['owner', 'admin'],
  'activity:read':    ['owner', 'admin', 'member'],
  'notifications:read': ['owner', 'admin', 'member'],
  'search:read':      ['owner', 'admin', 'member'],
};
```

### RBAC middleware (`server/middleware/rbac.js`)

```js
export const requireOrgRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.membership) return res.status(403).json({ success: false, message: 'No org context' });
  if (!allowedRoles.includes(req.membership.role)) {
    return res.status(403).json({ success: false, message: `Requires one of: ${allowedRoles.join(', ')}` });
  }
  next();
};

export const requirePermission = (permission) => (req, res, next) => {
  const allowed = PERMISSIONS[permission] || [];
  if (!allowed.includes(req.membership?.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};
```

### Membership controller (`server/controllers/membershipController.js`)

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `listMembers` | GET | `/api/memberships?orgId=...` | `protect`, `tenantContext`, `requirePermission('members:read')` | Find all memberships for `req.orgId`, populate `userId`. Sort by role then `joinedAt`. Search by name/email (regex with `escapeRegex`). Pagination (`limit` clamped to 50). |
| `updateMemberRole` | PATCH | `/api/memberships/:membershipId` | `protect`, `tenantContext`, `requirePermission('members:update')` | Whitelist `{ role }`. Validate against `ORG_ROLES`. **Hard rules:** (1) cannot change owner's role; (2) cannot promote anyone to `owner`; (3) cannot change own role; (4) admin cannot demote another admin. Log activity. |
| `removeMember` | DELETE | `/api/memberships/:membershipId` | `protect`, `tenantContext`, `requirePermission('members:remove')` | **Hard rules:** (1) cannot remove owner; (2) cannot remove self (use `leaveOrg`); (3) admin cannot remove another admin. Decrement `org.seatsUsed`. Log activity. |
| `leaveOrg` | DELETE | `/api/memberships/me?orgId=...` | `protect`, `tenantContext` | User leaves the org. Owner cannot leave. Decrement `seatsUsed`. |
| `transferOwnership` | POST | `/api/memberships/:membershipId/transfer-ownership` | `protect`, `tenantContext`, `requireOrgRole(['owner'])` | Body: `{ confirmPassword }`. Verify password. Promote target to `owner`, demote current owner to `admin`. Update `org.ownerId`. Log activity. |

### Membership routes

```
GET    /api/memberships                            → protect, tenantContext, requirePermission('members:read'), listMembers
PATCH  /api/memberships/:membershipId              → protect, tenantContext, requirePermission('members:update'), validate, updateMemberRole
DELETE /api/memberships/:membershipId              → protect, tenantContext, requirePermission('members:remove'), removeMember
DELETE /api/memberships/me                         → protect, tenantContext, leaveOrg
POST   /api/memberships/:membershipId/transfer-ownership → protect, tenantContext, requireOrgRole(['owner']), validate, transferOwnership
```

**SECURITY:**
- Compound unique index prevents duplicate memberships at the DB level.
- Role updates bounded by enum + business rules.
- Owner protection: cannot be removed, demoted, or have their org left without ownership transfer.
- Self-removal blocked via `removeMember`.
- Ownership transfer requires password reconfirmation.
- Search regex sanitized via `escapeRegex` to prevent ReDoS.
- Pagination `limit` clamped to ≤ 50.
- All role/membership changes logged to `ActivityLog` (STEP 10) and emit Socket.io events (STEP 12).

---

## STEP 6 — Invitation Model & API

Invitations let admins/owners invite new members by email. The recipient receives a magic link with a UUID token; clicking it accepts the invitation and creates a Membership. (Email **rendering** is handled in STEP 7.)

### Invitation schema (`server/models/Invitation.js`)

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `email` | String | Yes | — | trim, lowercase, valid email |
| `orgId` | ObjectId | Yes | — | ref: `Organization`, indexed |
| `role` | String | Yes | `'member'` | enum: `['admin', 'member']` (owner forbidden) |
| `token` | String | Yes | — | unique, indexed (UUID v4) |
| `invitedBy` | ObjectId | Yes | — | ref: `User` |
| `status` | String | Yes | `'pending'` | enum: `['pending', 'accepted', 'expired', 'revoked']` |
| `expiresAt` | Date | Yes | — | now + 7 days |
| `acceptedAt` | Date | No | — | — |
| `acceptedByUserId` | ObjectId | No | — | ref: `User` |

### Indexes

- `{ token: 1 }` unique
- `{ orgId: 1, status: 1 }`
- `{ email: 1, orgId: 1, status: 1 }` (prevents duplicate pending invites)

### Email service (`server/services/emailService.js`)

Uses Nodemailer with SMTP transport. Exports:

| Function | Purpose |
|---|---|
| `sendInvitationEmail({ to, inviterName, orgName, role, acceptUrl, expiresAt })` | Renders `templates/emails/invitation.html` (STEP 7), sends. |
| `sendWelcomeEmail({ to, name, orgName })` | After invitation acceptance. |
| `sendRoleChangedEmail({ to, name, orgName, newRole })` | When admin changes a member's role. |
| `sendPlanChangedEmail({ to, name, orgName, newPlan })` | When owner upgrades/downgrades. |
| `sendOrgSuspendedEmail({ to, ownerName, orgName, reason })` | When super admin suspends an org. |

The transporter is created once at module load. Failures should be logged but not crash the request.

### Invitation controller (`server/controllers/invitationController.js`)

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `createInvitation` | POST | `/api/invitations` | `protect`, `tenantContext`, `requirePermission('members:invite')`, `inviteLimiter` | Whitelist `{ email, role }`. Validate role ∈ `['admin','member']`. Reject if email already a member. Reject if pending invite exists. Reject if `seatsUsed >= seatLimit`. Generate `token = uuidv4()`, `expiresAt = now + 7d`. Send email. Log activity. |
| `listInvitations` | GET | `/api/invitations` | `protect`, `tenantContext`, `requirePermission('members:invite')` | List invitations for `req.orgId`. Filter by `?status=`. Paginated. |
| `revokeInvitation` | DELETE | `/api/invitations/:invitationId` | `protect`, `tenantContext`, `requirePermission('members:invite')` | Set `status: 'revoked'`. Log activity. |
| `resendInvitation` | POST | `/api/invitations/:invitationId/resend` | `protect`, `tenantContext`, `requirePermission('members:invite')`, `inviteLimiter` | Only if `status === 'pending'`. New token, extend expiry, re-send. |
| `getInvitationByToken` | GET | `/api/invitations/by-token/:token` | public | Returns metadata (org name, inviter name, email, role) — no token in response. |
| `acceptInvitation` | POST | `/api/invitations/accept` | `protect` | Body: `{ token }`. Validate: exists, pending, not expired, email matches `req.user.email`. Create `Membership`. Increment `org.seatsUsed`. Mark accepted. Send welcome email. Log activity. Emit Socket.io event. |

### Routes

```
POST   /api/invitations                       → protect, tenantContext, requirePermission('members:invite'), inviteLimiter, validate, createInvitation
GET    /api/invitations                       → protect, tenantContext, requirePermission('members:invite'), listInvitations
DELETE /api/invitations/:invitationId         → protect, tenantContext, requirePermission('members:invite'), revokeInvitation
POST   /api/invitations/:invitationId/resend  → protect, tenantContext, requirePermission('members:invite'), inviteLimiter, resendInvitation
GET    /api/invitations/by-token/:token       → globalLimiter, getInvitationByToken
POST   /api/invitations/accept                → protect, validate, acceptInvitation
```

**SECURITY:**
- UUID v4 tokens (122 bits of entropy).
- Single-use: once accepted, cannot be reused.
- 7-day server-enforced expiry.
- Cannot create an `owner` invitation (enum restriction).
- Email match required on accept — prevents token theft.
- Seat limit enforced on invite create AND accept.
- `inviteLimiter` (20/hour) prevents email spam abuse.
- Public `by-token` route returns no sensitive data.
- Revoked invitations cannot be accepted.

---

## STEP 7 — Email Template System (HTML)

Build a small HTML email template renderer with a shared base layout, branded styling, and per-event templates. No heavy template engine — use plain HTML + lightweight `{{variable}}` substitution.

### Folder layout (`server/templates/emails/`)

```
_base.html               # shared layout (header, footer, button styles)
invitation.html          # used by sendInvitationEmail
welcome.html             # used by sendWelcomeEmail
role-changed.html        # used by sendRoleChangedEmail
plan-changed.html        # used by sendPlanChangedEmail
org-suspended.html       # used by sendOrgSuspendedEmail
```

### Template variable syntax

Use simple `{{variable}}` placeholders. The renderer escapes all values by default to prevent **email-based XSS** when an attacker controls a name/email field.

Example `invitation.html` body fragment:

```html
<h1>You've been invited to {{orgName}}</h1>
<p>{{inviterName}} invited you to join <strong>{{orgName}}</strong> as <strong>{{role}}</strong>.</p>
<a href="{{acceptUrl}}" class="btn">Accept invitation</a>
<p class="muted">This invitation expires on {{expiresAt}}.</p>
<p class="muted">If you didn't expect this email, you can safely ignore it.</p>
```

### Renderer utility (`server/utils/renderEmail.js`)

```js
import fs from 'node:fs/promises';
import path from 'node:path';

const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

const cache = new Map();

export const renderEmail = async (templateName, vars = {}) => {
  if (!cache.has(templateName)) {
    const base = await fs.readFile(path.resolve('templates/emails/_base.html'), 'utf8');
    const body = await fs.readFile(path.resolve(`templates/emails/${templateName}.html`), 'utf8');
    cache.set(templateName, base.replace('{{content}}', body));
  }
  let html = cache.get(templateName);
  for (const [k, v] of Object.entries(vars)) {
    html = html.replaceAll(`{{${k}}}`, escapeHtml(v));
  }
  return html;
};

export const htmlToText = (html) =>
  html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
```

The renderer:
- Caches the merged base+body HTML at first read (per template).
- Escapes every value by default (no opt-out — `acceptUrl` is the only exception, but it must be a server-built URL, never user-supplied raw input).
- Provides a `htmlToText` helper for plain-text fallback.

### `_base.html` shape

A minimal responsive email layout:
- `<table>`-based layout (email-client compatibility).
- Inline-friendly CSS in `<style>` for max width 560 px, system font stack, neutral gray palette + brand color for primary button.
- Header: `{{appName}}` (default: `SaaS Dashboard`).
- Footer: small text "You're receiving this because you have an account on {{appName}}." + unsubscribe link placeholder (not functional in this template — just the structure).

### Email service integration

Update `services/emailService.js` to use the renderer:

```js
import nodemailer from 'nodemailer';
import { renderEmail, htmlToText } from '../utils/renderEmail.js';
import env from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST, port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
});

export const sendInvitationEmail = async ({ to, inviterName, orgName, role, acceptUrl, expiresAt }) => {
  const html = await renderEmail('invitation', { inviterName, orgName, role, acceptUrl, expiresAt });
  await transporter.sendMail({
    from: env.EMAIL_FROM, to, subject: `You're invited to ${orgName}`,
    html, text: htmlToText(html),
  });
};
```

### Preview script (`server/scripts/previewEmails.js`)

Optional dev tool: a small Node script that renders each template with sample data and writes the HTML to `tmp/email-previews/*.html`, then logs file paths. Run with `npm run preview:emails`. Add `tmp/` to `.gitignore`.

**SECURITY:**
- All variables HTML-escaped by default — prevents email-based XSS where an attacker registers with `<img onerror=...>` as their name.
- `acceptUrl` is server-constructed (`${env.CLIENT_URL}/invite/accept?token=${token}`) — never built from user input.
- Plain-text fallback prevents anti-spam scoring penalties for HTML-only mail.
- Template cache is read-only at runtime (no user-driven file path lookups — `templateName` comes from a closed enum of service functions).
- No email contains raw secrets, passwords, or full JWTs — only the invitation token (designed to be public).
- The `from` address is bound to `EMAIL_FROM` env var; never accepts a value from request input.

---

## STEP 8 — Members Management Aggregate API

This step ties STEP 5 (memberships) and STEP 6 (invitations) together for the frontend Members page. Most endpoints already exist; this step adds aggregated queries the UI needs.

### Aggregated members endpoint

Add a new function `getMembersOverview` in `membershipController.js`:

| Function | Method | Path | Behavior |
|---|---|---|---|
| `getMembersOverview` | GET | `/api/memberships/overview` | Returns: `{ members, pendingInvitations, counts: { total, owners, admins, members, pending }, seats: { used, limit } }`. Uses `Promise.all` for parallel fetches. |

### Frontend-facing payload shape

```json
{
  "success": true,
  "data": {
    "members": [
      { "_id": "...", "userId": { "_id": "...", "name": "...", "email": "...", "avatar": "..." }, "role": "owner", "joinedAt": "..." }
    ],
    "pendingInvitations": [
      { "_id": "...", "email": "...", "role": "member", "invitedBy": { "name": "..." }, "createdAt": "...", "expiresAt": "..." }
    ],
    "counts": { "total": 5, "owners": 1, "admins": 2, "members": 2, "pending": 3 },
    "seats": { "used": 5, "limit": 5 }
  }
}
```

### Mount the new route

```
GET /api/memberships/overview → protect, tenantContext, requirePermission('members:read'), getMembersOverview
```

**SECURITY:**
- All sub-queries respect tenant isolation via `req.orgId`.
- Counts computed via Mongo aggregation for accuracy and performance.
- Email addresses returned only to users with `members:read` permission.

---

## STEP 9 — Cloudinary Upload Integration

Handle file uploads for organization logos and user avatars.

### Cloudinary config (`server/config/cloudinary.js`)

Initialize `cloudinary.v2.config({ cloud_name, api_key, api_secret })` from env vars.

### Multer + Cloudinary storage (`server/middleware/upload.js`)

Two distinct storages, exported as separate middleware instances:

| Middleware | Folder | Allowed formats | Transformations |
|---|---|---|---|
| `uploadAvatar` | `saas-dashboard/avatars` | jpg, jpeg, png, webp | `width: 256, height: 256, crop: 'fill', gravity: 'face'` |
| `uploadOrgLogo` | `saas-dashboard/logos` | jpg, jpeg, png, webp, svg | `width: 512, height: 512, crop: 'fit', background: 'transparent'` |

Each must enforce:
- `limits: { fileSize: 5 * 1024 * 1024 }` (5 MB)
- `fileFilter` rejecting non-whitelisted MIME types

### Upload controller

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `uploadUserAvatar` | POST | `/api/uploads/avatar` | `protect`, `uploadLimiter`, `uploadAvatar.single('image')` | Returns `{ url, publicId }`. Caller updates User. |
| `uploadOrganizationLogo` | POST | `/api/uploads/org-logo` | `protect`, `tenantContext`, `requireOrgRole(['owner','admin'])`, `uploadLimiter`, `uploadOrgLogo.single('image')` | Returns same shape. Caller updates Org. |

### Routes

```
POST /api/uploads/avatar    → protect, uploadLimiter, uploadAvatar.single('image'), uploadUserAvatar
POST /api/uploads/org-logo  → protect, tenantContext, requireOrgRole(['owner','admin']), uploadLimiter, uploadOrgLogo.single('image'), uploadOrganizationLogo
```

**SECURITY:**
- MIME whitelist prevents malicious file types.
- 5 MB size limit enforced by multer.
- Filenames are server-generated by Cloudinary (no user-controlled paths).
- Cloudinary CDN serves files (origin server never serves uploads directly).
- Tenant + role check on org logo uploads.
- `uploadLimiter` (30/hour) prevents abuse.

---

## STEP 10 — Activity Log Model & Tracking System

Every meaningful action in an organization is logged. The activity feed is shown on the dashboard and a dedicated Activity page.

### ActivityLog schema (`server/models/ActivityLog.js`)

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `orgId` | ObjectId | Yes | — | ref: `Organization`, indexed |
| `actorId` | ObjectId | Yes | — | ref: `User` |
| `action` | String | Yes | — | enum (see below) |
| `targetType` | String | No | — | enum: `['user','membership','invitation','organization','billing']` |
| `targetId` | ObjectId | No | — | — |
| `metadata` | Mixed | No | `{}` | small JSON object with context |
| `createdAt` | Date | auto | `Date.now` | indexed (descending) |

### Action enum

```js
export const ACTIVITY_ACTIONS = [
  'org.created', 'org.updated', 'org.deleted', 'org.logo_changed',
  'member.invited', 'member.joined', 'member.role_changed', 'member.removed', 'member.left',
  'invitation.revoked', 'invitation.resent',
  'billing.plan_changed', 'billing.payment_recorded',
  'ownership.transferred',
];
```

### Indexes

- `{ orgId: 1, createdAt: -1 }`
- `{ actorId: 1, createdAt: -1 }`
- TTL on `{ createdAt: 1 }` with `expireAfterSeconds: 60 * 60 * 24 * 365` (1 year retention)

### Activity service (`server/services/activityService.js`)

```js
export const logActivity = async ({ orgId, actorId, action, targetType, targetId, metadata = {} }) => {
  try {
    const log = await ActivityLog.create({ orgId, actorId, action, targetType, targetId, metadata });
    socketService.emitToOrg(orgId, 'activity:new', log);
    return log;
  } catch (err) {
    logger.error({ err }, 'Activity log failed');
  }
};
```

This service is called from every controller after successful state changes. **Never throw from `logActivity`** — logging failures must not break the user's request.

### Activity controller

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `listActivity` | GET | `/api/activities` | `protect`, `tenantContext`, `requirePermission('activity:read')` | Paginated feed for `req.orgId`. Sort `createdAt: -1`. Filter by `?action=`, `?actorId=`, `?targetType=`. Populate `actorId`. `limit` clamped to 50. |
| `getActivityStats` | GET | `/api/activities/stats` | `protect`, `tenantContext`, `requirePermission('activity:read')` | Aggregation: count of actions in last 7d, last 30d, grouped by action type. |

**SECURITY:**
- Activity logs tenant-scoped — never returned across orgs.
- Logging fire-and-forget — controller success not blocked by logging failures.
- TTL auto-expires logs after 1 year.
- `actorId` always set from `req.user._id` server-side.
- No write endpoints exposed to clients — logs created only by internal services.

---

## STEP 11 — Mock Billing System & Plan Management

A mock subscription system that mirrors a real Stripe-style flow without actual payments. Users can "upgrade" between `free` and `pro`, and a billing history is recorded for each plan change.

### Plan definitions (`server/utils/constants.js`)

```js
export const PLANS = {
  free: { name: 'Free', price: 0, currency: 'USD', seatLimit: 5, features: ['Up to 5 members', 'Basic analytics', 'Community support'] },
  pro:  { name: 'Pro',  price: 29, currency: 'USD', seatLimit: 50, features: ['Up to 50 members', 'Advanced analytics', 'Priority support', 'Activity export', 'Custom branding'] },
};
```

### BillingRecord schema (`server/models/BillingRecord.js`)

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `orgId` | ObjectId | Yes | — | ref: `Organization`, indexed |
| `actorId` | ObjectId | Yes | — | ref: `User` |
| `type` | String | Yes | — | enum: `['subscription','upgrade','downgrade','invoice']` |
| `previousPlan` | String | No | — | enum: `['free','pro']` |
| `newPlan` | String | Yes | — | enum: `['free','pro']` |
| `amount` | Number | Yes | `0` | in USD cents |
| `currency` | String | Yes | `'USD'` | — |
| `status` | String | Yes | `'paid'` | enum: `['paid','pending','failed']` (mock — always 'paid') |
| `description` | String | No | — | human-readable |
| `invoiceNumber` | String | Yes | — | unique, format: `INV-{YYYY}{MM}-{shortid}` |
| `createdAt` | Date | auto | — | indexed |

### Indexes

- `{ orgId: 1, createdAt: -1 }`
- `{ invoiceNumber: 1 }` unique

### Billing controller

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `getCurrentPlan` | GET | `/api/billing/plan` | `protect`, `tenantContext` | Returns `{ plan, planUpdatedAt, seatsUsed, seatLimit, features }`. |
| `changePlan` | POST | `/api/billing/plan/change` | `protect`, `tenantContext`, `requirePermission('org:billing')` | Body: `{ newPlan }`. **Hard rule:** if downgrading and `seatsUsed > free.seatLimit`, reject. Update `org.plan`, `seatLimit`. Create `BillingRecord`. Log activity. Emit notification. |
| `listBillingHistory` | GET | `/api/billing/history` | `protect`, `tenantContext`, `requirePermission('org:billing')` | Paginated. Sort `createdAt: -1`. |
| `getInvoice` | GET | `/api/billing/invoice/:invoiceNumber` | `protect`, `tenantContext`, `requirePermission('org:billing')` | Verify `record.orgId === req.orgId`. Returns full record. |

### Invoice number generator (`server/utils/generateInvoiceNumber.js`)

```js
import crypto from 'node:crypto';

export const generateInvoiceNumber = () => {
  const d = new Date();
  const shortId = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${shortId}`;
};
```

**SECURITY:**
- Plan changes restricted to owners (`org:billing`).
- Downgrade blocked if it would violate seat limit.
- Plan and seat limit are server-controlled, never trusted from request body.
- `BillingRecord` is append-only — no update/delete endpoints.
- `actorId` always set from `req.user._id`.
- Mock-only: no real payment data, no card numbers, no PCI scope.

---

## STEP 12 — Notification Model & Socket.io Real-Time Layer

In-app notifications shown in a bell dropdown plus toast pop-ups. Delivered in real time via Socket.io and persisted to MongoDB.

### Notification schema (`server/models/Notification.js`)

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `userId` | ObjectId | Yes | — | ref: `User`, indexed (recipient) |
| `orgId` | ObjectId | Yes | — | ref: `Organization`, indexed |
| `type` | String | Yes | — | enum: `['invite_received','invite_accepted','role_changed','member_joined','member_removed','plan_changed','mention']` |
| `title` | String | Yes | — | max 120 |
| `message` | String | Yes | — | max 500 |
| `link` | String | No | — | client-side route |
| `metadata` | Mixed | No | `{}` | — |
| `read` | Boolean | Yes | `false` | indexed |
| `createdAt` | Date | auto | — | indexed |

### Indexes

- `{ userId: 1, read: 1, createdAt: -1 }`
- TTL on `{ createdAt: 1 }` with `expireAfterSeconds: 60 * 60 * 24 * 90` (90-day retention)

### Socket.io service (`server/services/socketService.js`)

```js
let io = null;
const userSockets = new Map(); // userId -> Set<socketId>

export const initSocket = (ioInstance) => {
  io = ioInstance;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id isActive');
      if (!user || !user.isActive) return next(new Error('Unauthorized'));
      socket.userId = String(user._id);
      next();
    } catch { next(new Error('Unauthorized')); }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);

    socket.on('join:org', async (orgId) => {
      const ok = await Membership.exists({ userId: socket.userId, orgId });
      if (!ok) return; // silently ignore unauthorized join
      socket.join(`org:${orgId}`);
    });
    socket.on('leave:org', (orgId) => socket.leave(`org:${orgId}`));

    socket.on('disconnect', () => {
      userSockets.get(uid)?.delete(socket.id);
      if (userSockets.get(uid)?.size === 0) userSockets.delete(uid);
    });
  });
};

export const emitToUser = (userId, event, payload) => {
  io?.to([...(userSockets.get(String(userId)) || [])]).emit(event, payload);
};

export const emitToOrg = (orgId, event, payload) => {
  io?.to(`org:${orgId}`).emit(event, payload);
};
```

### Notification controller

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `listMyNotifications` | GET | `/api/notifications` | `protect` | Paginated for `req.user._id`. Filter `?orgId=`, `?unread=true`. Limit clamped to 50. |
| `getUnreadCount` | GET | `/api/notifications/unread-count` | `protect` | Returns `{ count }`. |
| `markAsRead` | PATCH | `/api/notifications/:id/read` | `protect` | Verify ownership. |
| `markAllAsRead` | PATCH | `/api/notifications/read-all` | `protect` | Optional `?orgId=` filter. |
| `deleteNotification` | DELETE | `/api/notifications/:id` | `protect` | Verify ownership. |

### Notification creation helper (used internally)

```js
export const createNotification = async ({ userId, orgId, type, title, message, link, metadata }) => {
  const notif = await Notification.create({ userId, orgId, type, title, message, link, metadata });
  socketService.emitToUser(userId, 'notification:new', notif);
  return notif;
};
```

**SECURITY:**
- Socket.io JWT auth enforced in `io.use` — anonymous sockets rejected.
- Org room joins re-verified against membership server-side.
- Notification ownership enforced on every read/update/delete.
- Tenant context preserved on every notification.
- TTL auto-purges old notifications (90 days).
- No client-side notification creation endpoint.
- CORS on Socket.io strictly bound to `CLIENT_URL`.

---

## STEP 13 — Dashboard Metrics API (Hybrid)

Dashboard combines **real metrics** (members, invitations, activity counts) with **deterministic mock metrics** (revenue, growth charts) generated server-side based on the org's `_id` seed so charts look stable across refreshes.

### Dashboard controller

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `getOverview` | GET | `/api/dashboard/overview` | `protect`, `tenantContext` | Aggregated payload (see below). |
| `getActivityChart` | GET | `/api/dashboard/charts/activity` | `protect`, `tenantContext` | Real: events grouped by day, last 30 days. |
| `getGrowthChart` | GET | `/api/dashboard/charts/growth` | `protect`, `tenantContext` | Mock: deterministic growth curve. |
| `getRevenueChart` | GET | `/api/dashboard/charts/revenue` | `protect`, `tenantContext` | Mock: deterministic revenue series. |

### Overview payload shape

```json
{
  "kpis": {
    "totalMembers": 12,
    "pendingInvitations": 3,
    "activitiesLast7d": 47,
    "currentPlan": "pro",
    "monthlyRevenue": 290000,
    "growthRate": 12.4,
    "activeUsersToday": 8
  },
  "recentActivity": [/* 5 most recent activity logs, populated */],
  "seats": { "used": 12, "limit": 50 }
}
```

### Deterministic mock generator

```js
const seedFromId = (id) => {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
};

export const mockRevenueSeries = (org, days = 30) => {
  const seed = seedFromId(org._id);
  return Array.from({ length: days }, (_, i) => {
    const base = (org.plan === 'pro' ? 9000 : 1200);
    const wave = Math.sin((seed + i) * 0.3) * 1500;
    return { day: i, value: Math.round(base + wave + (i * 50)) };
  });
};
```

Mock series should clearly indicate `mock: true` in the response so the frontend can label them `(Sample data)`.

**SECURITY:**
- All dashboard data tenant-scoped.
- Read-only — no write endpoints.
- Mock data clearly flagged.
- Aggregations use `$match`+`$group` (no regex on user input).

---

## STEP 14 — Search API & Global Filters

A cross-resource search endpoint that powers the client command palette (STEP 36) and any inline search inputs. Tenant-scoped, fast, regex-safe.

### Endpoint

```
GET /api/search?q=<query>&types=<csv>&limit=<int>
```

- `q` — required, min 1 char, max 100 chars
- `types` — optional CSV of `'members'`, `'invitations'`, `'activities'` (default: all)
- `limit` — per-group result limit, default 5, max 10

### Controller (`server/controllers/searchController.js`)

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `globalSearch` | GET | `/api/search` | `protect`, `tenantContext`, `requirePermission('search:read')`, `searchLimiter` | Validates `q`, escapes regex chars, runs parallel `Promise.all` queries against the requested resource types, returns grouped results. |

### Response shape

```json
{
  "success": true,
  "data": {
    "query": "ali",
    "results": {
      "members":     [{ "_id": "...", "userId": { "name": "...", "email": "...", "avatar": "..." }, "role": "admin" }],
      "invitations": [{ "_id": "...", "email": "...", "role": "member", "status": "pending" }],
      "activities":  [{ "_id": "...", "action": "member.invited", "actor": { "name": "..." }, "createdAt": "..." }]
    },
    "totals": { "members": 1, "invitations": 1, "activities": 0 }
  }
}
```

### Query implementations (each tenant-scoped via `req.orgId`)

| Group | Mongo query |
|---|---|
| members | Lookup users by `name` or `email` regex (escaped), then `Membership.find({ orgId, userId: { $in: matchedIds } })` populated. |
| invitations | `Invitation.find({ orgId, email: regex, status: 'pending' })`. |
| activities | `ActivityLog.find({ orgId, $or: [{ action: regex }, { 'metadata.email': regex }] })` populated. |

### Regex utility (`server/utils/escapeRegex.js`)

```js
export const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```

Always wrap user input with this before constructing a `RegExp`. Combine with case-insensitive flag: `new RegExp(escapeRegex(q), 'i')`.

### Validation (`server/validators/searchValidators.js`)

- `q`: string, length 1-100, `escape()` for XSS, then `escapeRegex` in controller for ReDoS.
- `types`: optional CSV, each value ∈ `['members','invitations','activities']`.
- `limit`: integer 1-10.

### Routes (`server/routes/searchRoutes.js`)

```
GET /api/search → protect, tenantContext, requirePermission('search:read'), searchLimiter, validate, globalSearch
```

**SECURITY:**
- Strict tenant scoping — every sub-query includes `orgId: req.orgId`.
- `escapeRegex` prevents ReDoS attacks via crafted input like `(a+)+`.
- `q` length capped at 100 chars to prevent oversized regex builds.
- Per-group `limit` capped at 10 (clamped server-side regardless of client value).
- `searchLimiter` (60/minute) prevents brute-force enumeration.
- Members search returns only public-safe fields (`name`, `email`, `avatar`, `role`) — no password, no internal IDs beyond what's already exposed in member listings.
- No write surface — read-only endpoint.

---

## STEP 15 — Super Admin API

Platform-level administration: super admins (created via the seed script) can list/manage all organizations, suspend users, and view platform stats. They bypass tenant isolation via the explicit handling in `tenantContext`.

### Super admin controller

| Function | Method | Path | Auth | Behavior |
|---|---|---|---|---|
| `getPlatformStats` | GET | `/api/super-admin/stats` | `protect`, `superAdminOnly` | Returns `{ totalUsers, totalOrgs, totalMemberships, planBreakdown: { free, pro }, signupsLast30d, activityLast24h }`. |
| `listAllOrgs` | GET | `/api/super-admin/orgs` | `protect`, `superAdminOnly`, `superAdminLimiter` | Paginated. Filter `?plan=`, `?search=` (escaped), `?isDeleted=`. Includes `ownerId` populated and member count. |
| `getOrgDetails` | GET | `/api/super-admin/orgs/:orgId` | `protect`, `superAdminOnly` | Full org details + members + recent activity + billing. |
| `suspendOrg` | PATCH | `/api/super-admin/orgs/:orgId/suspend` | `protect`, `superAdminOnly` | Body: `{ reason }`. Sets `isDeleted: true` (soft suspend). Notifies owner via email + notification. |
| `restoreOrg` | PATCH | `/api/super-admin/orgs/:orgId/restore` | `protect`, `superAdminOnly` | Sets `isDeleted: false`. |
| `forceDeleteOrg` | DELETE | `/api/super-admin/orgs/:orgId` | `protect`, `superAdminOnly` | Hard delete + cascade. Body must include `{ confirmName }`. |
| `listAllUsers` | GET | `/api/super-admin/users` | `protect`, `superAdminOnly`, `superAdminLimiter` | Paginated. Filter `?search=`, `?platformRole=`, `?isActive=`. |
| `updateUserStatus` | PATCH | `/api/super-admin/users/:userId` | `protect`, `superAdminOnly` | Whitelist `{ isActive, platformRole }`. **Hard rules:** (1) cannot deactivate self; (2) cannot demote the last super admin; (3) cannot edit another super admin unless current user is the only one. |

### Last super admin protection

```js
if (currentRole === 'superadmin' && newRole !== 'superadmin') {
  const count = await User.countDocuments({ platformRole: 'superadmin', isActive: true });
  if (count <= 1) return res.status(400).json({ success: false, message: 'Cannot demote the last super admin' });
}
```

**SECURITY:**
- Every route requires `protect` + `superAdminOnly`.
- `superAdminLimiter` (100 req / 15 min) prevents abuse even by privileged users.
- Self-protection: cannot deactivate self or demote the last super admin.
- Force delete requires explicit name confirmation.
- All super admin actions logged to ActivityLog with `actorType: 'superadmin'` metadata.
- Search regex sanitized via `escapeRegex`.

---

## STEP 16 — API Documentation (Swagger / OpenAPI)

Generate live, browseable API documentation from JSDoc-style comments using `swagger-jsdoc` + `swagger-ui-express`.

### Setup (`server/config/swagger.js`)

```js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SaaS Dashboard Template API',
      version: '1.0.0',
      description: 'Multi-tenant SaaS API with RBAC, invitations, billing, and real-time notifications.',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        orgIdHeader: { type: 'apiKey', in: 'header', name: 'x-org-id' },
      },
      schemas: { /* User, Organization, Membership, Invitation, etc. */ },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js'],
};

export default swaggerJsdoc(options);
```

### Mount Swagger UI in `server/index.js`

```js
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const docsEnabled = env.NODE_ENV !== 'production' || env.EXPOSE_DOCS_IN_PROD === 'true';
if (docsEnabled) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'SaaS Dashboard API' }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}
```

### Required schema definitions in `swagger.js` `components.schemas`

Define schemas matching the Mongoose models (subset of safe fields):

| Schema | Fields |
|---|---|
| `User` | `_id`, `name`, `email`, `avatar`, `platformRole`, `isActive`, `createdAt` |
| `Organization` | `_id`, `name`, `slug`, `logo`, `description`, `plan`, `seatsUsed`, `seatLimit`, `ownerId`, `createdAt` |
| `Membership` | `_id`, `userId`, `orgId`, `role`, `joinedAt` |
| `Invitation` | `_id`, `email`, `orgId`, `role`, `status`, `expiresAt`, `createdAt` (NEVER include `token`) |
| `BillingRecord` | `_id`, `orgId`, `type`, `previousPlan`, `newPlan`, `amount`, `currency`, `status`, `invoiceNumber`, `createdAt` |
| `Notification` | `_id`, `userId`, `orgId`, `type`, `title`, `message`, `link`, `read`, `createdAt` |
| `ActivityLog` | `_id`, `orgId`, `actorId`, `action`, `targetType`, `targetId`, `metadata`, `createdAt` |
| `ApiError` | `success: false`, `message: string` |

### Annotation pattern (in route files)

```js
/**
 * @openapi
 * /memberships:
 *   get:
 *     summary: List members of the current organization
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/Membership' } } } }
 *       403: { description: Forbidden }
 */
router.get('/', protect, tenantContext, requirePermission('members:read'), listMembers);
```

Annotate **every public route** (auth, organizations, memberships, invitations, billing, dashboard, notifications, search, uploads, super-admin).

**SECURITY:**
- `/api/docs` route is **disabled in production by default** — only mounted when `NODE_ENV !== 'production'` or the explicit `EXPOSE_DOCS_IN_PROD=true` env flag is set.
- Schemas exclude sensitive fields (`password`, JWT tokens, invitation `token`).
- No real example values — placeholder strings only (e.g. `"name": "Demo Org"`, never a real org name).
- Swagger UI itself is read-only — it does not execute requests unless the user manually does so via the "Try it out" button (which uses their own browser session/token).
- The OpenAPI JSON at `/api/docs.json` is also gated by the same env flag.

---

## STEP 17 — Logging & Production Observability

Replace ad-hoc `console.log` with structured logging using `pino` + `pino-http` for request logs.

### Logger config (`server/config/logger.js`)

```js
import pino from 'pino';
import env from './env.js';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.token',
  '*.password',
  '*.token',
];

export const logger = pino({
  level: env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: { paths: redactPaths, censor: '[REDACTED]' },
  base: { env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

### Request ID middleware (`server/middleware/requestId.js`)

```js
import { randomUUID } from 'node:crypto';

export const requestId = (req, _res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  next();
};
```

### HTTP request logger (mount after `requestId`)

```js
import pinoHttp from 'pino-http';
import { logger } from './config/logger.js';

app.use(pinoHttp({
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
}));
```

### Replace `console.*` across the codebase

- Replace `console.log` → `logger.info` or `req.log.info` (when in handler scope).
- Replace `console.error` → `logger.error({ err }, 'context')`.
- Replace `console.warn` → `logger.warn`.
- The error handler logs `req.log.error({ err })` with the request context.

### Optional integrations

The logger is structured JSON in production — easily ingested by:
- **Sentry** (via `@sentry/node` + `Sentry.captureException` in error handler)
- **Datadog** / **Logtail** / **Better Stack** — JSON ingestion via stdout shipping
- **Render's built-in log explorer** — works out of the box with stdout

Keep the integration code commented in the project as an opt-in (clearly marked `// Optional: enable in production by uncommenting`).

**SECURITY:**
- Redact paths cover `Authorization` header, `Cookie` header, all `password*` body fields, `token` body fields.
- Catch-all `*.password` and `*.token` redact deeply nested occurrences.
- Logger output never includes `process.env`, full request bodies, or full headers.
- Request IDs let you trace a single request through all log lines without exposing user data.
- In production, log level defaults to `info` — `debug` and `trace` levels (which can be more verbose) require explicit env toggle.
- Never log JWT tokens, refresh tokens, password hashes, Cloudinary signatures, or SMTP passwords.
- Do not echo `process.env` values anywhere (no `logger.info(env)`).

---

## STEP 18 — Backend Request Validators

Use `express-validator` to validate every incoming request. Each validator file exports an array of validation chains. The shared `validate` middleware (`server/middleware/validate.js`) runs `validationResult(req)` and returns `{ success: false, errors: [...] }` on failure.

### `validate` middleware

```js
import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    success: false,
    errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
  });
};
```

### Required validator coverage

| Validator file | Endpoints covered | Key rules |
|---|---|---|
| `authValidators.js` | register, login, updateProfile, changePassword, deleteAccount | name 2-60 + escape, email valid + normalize + escape, password min 8 |
| `organizationValidators.js` | createOrg, updateOrg, deleteOrg | name 2-80 + escape, description 0-500 + escape, deleteOrg requires `confirmName` |
| `membershipValidators.js` | updateMemberRole, transferOwnership | role ∈ enum, transferOwnership requires `confirmPassword` |
| `invitationValidators.js` | createInvitation, acceptInvitation | email valid + normalize, role ∈ `['admin','member']`, accept requires valid UUID format |
| `billingValidators.js` | changePlan | newPlan ∈ `['free','pro']` |
| `searchValidators.js` | globalSearch | q 1-100 + escape, types CSV ⊂ allowed, limit 1-10 |

### Validator chain example (auth register)

```js
import { body } from 'express-validator';

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).escape(),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
];
```

### Mount pattern

Each route uses the validator array followed by the `validate` middleware:

```js
router.post('/register', authLimiter, registerRules, validate, register);
```

**SECURITY:**
- `escape()` applied to all user-facing text (name, description, message) — prevents stored XSS.
- `normalizeEmail()` applied to all email fields — consistent storage.
- Password minimums enforced server-side (client validation is UX only).
- Length caps applied to every string field — prevents oversized payloads.
- Enum validation prevents arbitrary string values for role/plan/status fields.
- Search query length capped — prevents oversized regex builds (paired with `escapeRegex` in STEP 14).

---

## STEP 19 — Comprehensive Security Audit

Before merging, verify every item below is implemented. Treat unchecked items as bugs.

### Core security checklist

- [ ] Mass assignment: every controller destructures only allowed fields (no `Model.create(req.body)`)
- [ ] Role protection: `platformRole` not settable via register, update profile, or any public route
- [ ] Org role protection: `role` field on Membership not settable via public endpoints to `'owner'`
- [ ] User enumeration: identical error for wrong email vs wrong password (`"Invalid email or password"`)
- [ ] Password: hashed (bcrypt rounds 12), `select: false`, never returned, change requires current
- [ ] Account deletion requires password confirmation; cascades all related data
- [ ] JWT secret: min 32 chars enforced at startup in production (process exits if invalid)
- [ ] Rate limiters: separate instances for global, auth, invite, upload, search, super-admin (all mounted)
- [ ] Helmet: enabled with default config
- [ ] CORS: strict specific origin from `CLIENT_URL`, never `*` in production
- [ ] Body size limits: `express.json({ limit: '10kb' })` and `urlencoded({ limit: '10kb' })`
- [ ] mongo-sanitize: applied via custom middleware on `req.body` and `req.params` only
- [ ] Express 5 compatibility: no middleware assigns to `req.query`; `hpp` is NOT installed
- [ ] XSS: `escape()` on all text inputs in express-validator chains
- [ ] ReDoS: regex special characters escaped via `escapeRegex` in all search queries
- [ ] Tenant isolation: `tenantContext` middleware applied on every org-scoped route; super admin bypass is explicit
- [ ] Ownership checks: update/delete operations verify `actorUserId === resource.userId` OR admin role
- [ ] Member role hard rules enforced: cannot self-promote, cannot promote to owner via API, owner cannot be removed/demoted/leave
- [ ] Super admin self-protection: cannot deactivate self, cannot demote last super admin
- [ ] Pagination clamp: `limit` ≤ 50, `page` forced to positive integer in every paginated endpoint
- [ ] File upload: MIME whitelist, 5 MB size limit, server-generated filenames via Cloudinary
- [ ] Cascade deletes: org delete removes memberships, invitations, notifications, activity logs
- [ ] Error handler: no stack traces or internal paths in production
- [ ] x-powered-by disabled
- [ ] `.env.example` synced with all required variables (no real secrets)
- [ ] No `console.log` of sensitive data anywhere; logger redact paths cover `Authorization`, `password*`, `token*`
- [ ] Token transport: JWT in `Authorization: Bearer` header only
- [ ] Mongoose 9 hooks: all `pre`/`post` middleware use `async function()` without `next` parameter
- [ ] Socket.io: JWT auth enforced in `io.use`; `join:org` re-verifies membership server-side
- [ ] Invitation tokens: UUID v4, single-use, 7-day expiry, email match required on accept
- [ ] Seat limit: enforced on invite create AND accept; downgrade blocked when over limit
- [ ] Activity log: `actorId` always set server-side from `req.user._id`
- [ ] Email templates: all variables HTML-escaped to prevent email-XSS
- [ ] Swagger docs: disabled in production by default; gated by `EXPOSE_DOCS_IN_PROD` flag
- [ ] Search API: tenant-scoped, regex-escaped, length-capped, rate-limited

### Public Repository Security Sub-Checklist

These items are specific to the public-repo posture and must be re-verified before every push/publish:

- [ ] No real secret values appear anywhere in the source tree (search for `mongodb+srv://`, `sk_`, `pk_`, your real Cloudinary cloud name, real SMTP password, real super admin password)
- [ ] No environment variables have fallback default values containing real-looking secrets in code
- [ ] `.env.example` placeholders are obviously fake (literal `replace-this-with-...` text, not random-looking strings)
- [ ] `.gitignore` excludes `.env`, `.env.*` (with `!.env.example` exception), `*.pem`, `*.key`, `*.crt`, `uploads/`, `logs/`, build output, IDE/OS files
- [ ] No `console.log(req.body)`, `console.log(req.user)`, `console.log(token)`, or `console.log(process.env)` anywhere
- [ ] No commented-out code containing connection strings, tokens, or hardcoded passwords
- [ ] No real personal email addresses, phone numbers, or names in seed scripts, fixtures, or sample data
- [ ] No internal hostnames, IPs, or third-party project IDs in code/comments
- [ ] README screenshots in `docs/` are demo/redacted
- [ ] No CI workflow file echoes secrets to logs; all secrets use `${{ secrets.NAME }}`
- [ ] LICENSE file present (MIT recommended)
- [ ] If a secret was ever accidentally committed, it is treated as compromised — rotate it on the provider before publishing

---

## STEP 20 — Client Setup: Vite, Tailwind, Axios, Services

### Vite config (`client/vite.config.js`)

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
  test: { globals: true, environment: 'jsdom', setupFiles: './src/tests/setup.js' },
});
```

### Tailwind v4 setup (`client/src/index.css`)

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-brand-50:  oklch(0.97 0.02 270);
  --color-brand-500: oklch(0.62 0.18 270);
  --color-brand-600: oklch(0.55 0.20 270);
  --color-brand-700: oklch(0.48 0.20 270);

  --color-surface-light: oklch(0.99 0 0);
  --color-surface-dark:  oklch(0.18 0.01 270);

  --font-sans: 'Inter', system-ui, sans-serif;
}

@layer base {
  html, body, #root { height: 100%; }
  body { @apply bg-gray-50 text-gray-900 antialiased; font-family: var(--font-sans); }
  .dark body { @apply bg-gray-950 text-gray-100; }
}

@layer utilities {
  .scrollbar-thin { scrollbar-width: thin; }
  .glass { backdrop-filter: blur(12px); background-color: rgb(255 255 255 / 0.7); }
}
```

### Axios instance (`client/src/api/axiosInstance.js`)

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: false,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saas:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const orgId = localStorage.getItem('saas:activeOrgId');
  if (orgId) config.headers['x-org-id'] = orgId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('saas:token');
      localStorage.removeItem('saas:activeOrgId');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### All service files (`client/src/services/`)

Each service file exports named functions wrapping `api.get/post/patch/delete`:

| File | Functions |
|---|---|
| `authService.js` | `register`, `login`, `getMe`, `updateProfile`, `changePassword`, `completeOnboarding`, `deleteAccount` |
| `organizationService.js` | `createOrg`, `getMyOrgs`, `getOrgById`, `updateOrg`, `deleteOrg` |
| `membershipService.js` | `getMembersOverview`, `updateMemberRole`, `removeMember`, `leaveOrg`, `transferOwnership` |
| `invitationService.js` | `createInvitation`, `listInvitations`, `revokeInvitation`, `resendInvitation`, `getInvitationByToken`, `acceptInvitation` |
| `activityService.js` | `listActivity`, `getActivityStats` |
| `billingService.js` | `getCurrentPlan`, `changePlan`, `listBillingHistory`, `getInvoice` |
| `notificationService.js` | `listMyNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification` |
| `dashboardService.js` | `getOverview`, `getActivityChart`, `getGrowthChart`, `getRevenueChart` |
| `searchService.js` | `globalSearch(q, types, limit)` |
| `uploadService.js` | `uploadAvatar(file)`, `uploadOrgLogo(file)` (FormData) |
| `superAdminService.js` | `getPlatformStats`, `listAllOrgs`, `getOrgDetails`, `suspendOrg`, `restoreOrg`, `forceDeleteOrg`, `listAllUsers`, `updateUserStatus` |

### Custom hooks (`client/src/hooks/`)

| Hook | Purpose |
|---|---|
| `useLocalStorage(key, initial)` | State synced to localStorage |
| `useDebounce(value, delay)` | Debounce search inputs (300 ms typical) |
| `useHotkey(combo, handler)` | Register a keyboard shortcut (e.g. `'mod+k'`) |
| `useAuth()` | `useContext(AuthContext)` |
| `useOrg()` | `useContext(OrgContext)` |
| `useTheme()` | `useContext(ThemeContext)` |
| `useSocket()` | `useContext(SocketContext)` |

**SECURITY:**
- Token + activeOrgId stored in `localStorage` with `saas:` namespace prefix to avoid collisions.
- 401 response auto-clears credentials and redirects.
- No `dangerouslySetInnerHTML` usage anywhere.
- Axios timeout (15s) prevents hanging requests.
- `VITE_API_URL` is an env var, never hardcoded.

---

## STEP 21 — Client State: Contexts (Auth, Org, Socket, Notification)

### `AuthContext` (`client/src/context/AuthContext.jsx`)

State:
- `user` (null or User object)
- `token` (from localStorage `saas:token`)
- `loading` (true on initial mount until `getMe` resolves)

Methods:
- `login(email, password)` — calls `authService.login`, stores token, sets user.
- `register(payload)` — same shape.
- `logout()` — clears token + activeOrgId, navigates to `/login`.
- `updateUser(patch)` — local merge after profile updates.
- `completeOnboarding()` — sets `user.hasCompletedOnboarding = true` after server call.

On mount: if `token` exists, call `getMe()` and set user; on failure clear token.

### `OrgContext` (`client/src/context/OrgContext.jsx`)

State:
- `orgs` (list from `getMyOrgs`)
- `activeOrg` (currently selected org)
- `currentMembership` (the user's role in `activeOrg`)
- `loading`

Methods:
- `switchOrg(orgId)` — sets `localStorage.saas:activeOrgId`, updates `activeOrg`, emits Socket.io `leave:org` (old) + `join:org` (new), refetches dashboard data downstream.
- `refreshOrgs()` — re-calls `getMyOrgs`.
- `setActiveOrgFirstAvailable()` — used after login when no `activeOrgId` stored.

When user has zero orgs, redirect to `/create-org`.

### `SocketContext` (`client/src/context/SocketContext.jsx`)

Holds the `socket.io-client` instance. On mount (when token + activeOrg ready), connects with `auth: { token }`. Joins `org:<activeOrgId>` room. Listens for `notification:new` and `activity:new`, dispatches to `NotificationContext`.

### `NotificationContext` (`client/src/context/NotificationContext.jsx`)

State:
- `notifications` (list, capped to 50 in memory)
- `unreadCount`

Methods:
- `addNotification(notif)` — prepended; shows toast via `react-hot-toast`.
- `markRead(id)` — calls service + updates state.
- `markAllRead()` — calls service + bulk update.

On mount, fetches initial unread count + last 20 notifications.

### Provider composition in `App.jsx`

```jsx
<AuthProvider>
  <ThemeProvider>
    <OrgProvider>
      <SocketProvider>
        <NotificationProvider>
          <Toaster position="top-right" />
          <RouterProvider router={router} />
        </NotificationProvider>
      </SocketProvider>
    </OrgProvider>
  </ThemeProvider>
</AuthProvider>
```

**SECURITY:**
- Socket.io connects with token in `auth` payload (not as query string — query strings can leak in logs/referrers).
- Each context only stores data the user is allowed to see.
- No global window.* exposure of state.

---

## STEP 22 — Theme System (Light / Dark / System)

User-selectable theme with light/dark/system options, persisted to localStorage, applied via the `.dark` class on the `<html>` element.

### `ThemeContext` (`client/src/context/ThemeContext.jsx`)

State:
- `theme: 'light' | 'dark' | 'system'` (default `'system'`, stored in `localStorage.saas:theme`)
- `resolvedTheme: 'light' | 'dark'` (the actually-applied theme — system resolves dynamically)

Methods:
- `setTheme(value)` — stores in localStorage, updates state.

### Detection + application

```jsx
useEffect(() => {
  const apply = () => {
    const isSystem = theme === 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (isSystem && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    setResolvedTheme(isDark ? 'dark' : 'light');
  };
  apply();
  if (theme === 'system') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }
}, [theme]);
```

### FOUC prevention (in `index.html`)

Add a tiny inline script in `<head>` that runs **before** React mounts to set the initial theme class — prevents the flash of light mode on first load:

```html
<script>
  (function() {
    try {
      var t = localStorage.getItem('saas:theme') || 'system';
      var dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      if (dark) document.documentElement.classList.add('dark');
    } catch (e) {}
  })();
</script>
```

### `ThemeToggle` component (`client/src/components/common/ThemeToggle.jsx`)

A small dropdown or icon-button cycling through `light → dark → system → light`. Shows the current selection's icon (sun / moon / monitor). Mount it in the user menu and account settings page.

### Tailwind dark variant usage

Use `dark:` prefix throughout components: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-gray-100`. The `@custom-variant dark` line in `index.css` (STEP 20) configures Tailwind v4 to use the `.dark` class.

**SECURITY:**
- No security concerns — purely cosmetic.
- localStorage value is constrained to enum (`'light' | 'dark' | 'system'`) — invalid values default to `'system'` to prevent arbitrary class injection.
- Inline FOUC script wrapped in `try/catch` to never crash the page.

---

## STEP 23 — React Error Boundaries & Global Error UX

Catch render-time errors with React error boundaries and present a friendly fallback UI without exposing stack traces in production.

### `ErrorBoundary` component (`client/src/components/common/ErrorBoundary.jsx`)

Class component implementing `componentDidCatch` and `getDerivedStateFromError`:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, errorId: null };

  static getDerivedStateFromError() {
    return { hasError: true, errorId: crypto.randomUUID() };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error(error, info);
    // Optional: send to Sentry/etc. — use env-gated import to avoid bundling in dev
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return this.props.fallback ?? <ErrorFallback errorId={this.state.errorId} onReset={() => this.setState({ hasError: false })} />;
  }
}
```

### `ErrorFallback` component (`client/src/components/common/ErrorFallback.jsx`)

A friendly, branded error UI:
- Heading: "Something went wrong"
- Subheading: "Please try again. If the problem persists, contact support."
- Reference ID (the `errorId`) shown small for support ticket reference
- Two buttons: "Reload page" (calls `window.location.reload()`) and "Try again" (calls `onReset` to re-render)
- **No stack traces, no error messages from the caught error** — those leak internals to end users.

### Boundary placement

Three layers, increasing granularity:

1. **App-level** in `App.jsx` — wraps the entire `<RouterProvider />`. Catches catastrophic errors anywhere.
2. **Layout-level** in `OrgLayout.jsx` and `AdminLayout.jsx` — wraps the `<Outlet />`. A page crash falls back to the layout's chrome.
3. **Critical widget level** — wrap heavy components like the Recharts dashboard, the command palette, and the notification dropdown individually. A crash in one widget doesn't take down the whole page.

### Global async error handling

Add a single listener (in `main.jsx`) for unhandled promise rejections:

```js
window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) console.error('Unhandled promise rejection:', event.reason);
  toast.error('An unexpected error occurred.');
});
```

### Axios error toasts (already wired in STEP 20)

Network errors caught by Axios interceptor → friendly toast. Never display raw `err.response.data.stack` to users.

**SECURITY:**
- Stack traces never rendered in production UI.
- Error IDs are random UUIDs — no PII leaked to support context.
- The `ErrorFallback` has no inline event handlers parsing `error.message` (no risk of rendering attacker-controlled error text).
- Optional Sentry integration is **opt-in** and gated by env to avoid leaking internal details by default.

---

## STEP 24 — Layouts (Auth, Org, Admin)

Three top-level layouts. Each renders an `<Outlet />` for nested routes.

| Layout | Wraps | Used by |
|---|---|---|
| `AuthLayout` | `<Outlet />` centered on a branded background | `/login`, `/register`, `/create-org`, `/invite/accept` |
| `OrgLayout` | `<Sidebar />` + (`<Topbar />` + `<Outlet />`), responsive (sidebar collapses on `<lg`) | All `/app/*` routes |
| `AdminLayout` | Same shell as OrgLayout but with super-admin sidebar nav | All `/super-admin/*` routes |

### `AuthLayout`

- Centered card on a gradient background
- Brand logo at top
- `<Outlet />` for the form
- Footer note: "By continuing, you agree to our terms."

### `OrgLayout`

Three regions:
- **Sidebar** (left, fixed-width 240 px on `lg+`, hidden on mobile with hamburger trigger)
- **Topbar** (sticky top, holds page title, search trigger, notification bell, user menu)
- **Main** (`<Outlet />` with consistent padding and max-width container)

Wrap the `<Outlet />` in an `<ErrorBoundary />` (STEP 23).

### Sidebar (`client/src/components/layout/Sidebar.jsx`)

- Logo at top
- `<OrgSwitcher />` (dropdown showing current org + list)
- Nav links (filtered by permission via `usePermissions()` helper):
  - Dashboard (always visible)
  - Members (always)
  - Activity (always)
  - Billing (owner only)
  - Settings (admin+)
- Bottom: user menu (avatar, name, logout)
- Mobile: hamburger toggles a slide-in drawer with backdrop

### Topbar (`client/src/components/layout/Topbar.jsx`)

- Page title (passed via context or route data)
- Search button (opens command palette — STEP 36; shows ⌘K hint)
- `<NotificationBell />`
- `<ThemeToggle />`
- User avatar dropdown (Account Settings, Logout)

### `OrgSwitcher` (`client/src/components/layout/OrgSwitcher.jsx`)

- Shows `activeOrg.name` + `activeOrg.logo`
- Click opens dropdown listing all orgs from `useOrg().orgs`
- Each item shows org logo + name + user's role badge
- Selecting an org calls `switchOrg(orgId)`
- "Create new organization" link at the bottom → navigates to `/create-org`

### `NotificationBell` (`client/src/components/layout/NotificationBell.jsx`)

- Bell icon with unread count badge
- Dropdown showing 10 most recent notifications
- "Mark all as read" + "View all"
- Click navigates to `notification.link`

### `AdminLayout`

Same shell as `OrgLayout` but the Sidebar shows super-admin nav: Dashboard, All Orgs, All Users. No `<OrgSwitcher />` (super admin operates platform-wide).

**SECURITY:**
- Sidebar nav items hidden based on permissions to prevent confusion (backend still enforces — never trust client UI).
- Org switcher list is fetched from server (`getMyOrgs`), not from URL params.

---

## STEP 25 — Routing & Route Guards

### App router (`client/src/App.jsx`)

```
<Routes>
  <Route element={<GuestOnlyRoute />}>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>
  </Route>

  <Route path="/invite/accept" element={<AuthLayout />}>
    <Route index element={<AcceptInvitePage />} />
  </Route>

  <Route element={<ProtectedRoute />}>
    <Route element={<AuthLayout />}>
      <Route path="/create-org" element={<CreateOrgPage />} />
    </Route>
  </Route>

  <Route path="/app" element={<ProtectedRoute requireOrg />}>
    <Route element={<OrgLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="members" element={<OrgRoleRoute roles={['owner','admin','member']}><MembersPage /></OrgRoleRoute>} />
      <Route path="activity" element={<ActivityPage />} />
      <Route path="billing" element={<OrgRoleRoute roles={['owner']}><BillingPage /></OrgRoleRoute>} />
      <Route path="settings" element={<OrgSettingsPage />} />
      <Route path="account" element={<AccountSettingsPage />} />
    </Route>
  </Route>

  <Route path="/super-admin" element={<SuperAdminRoute />}>
    <Route element={<AdminLayout />}>
      <Route index element={<SuperAdminDashboardPage />} />
      <Route path="orgs" element={<AllOrgsPage />} />
      <Route path="users" element={<AllUsersPage />} />
    </Route>
  </Route>

  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Route guard components (`client/src/routes/`)

| Guard | Behavior |
|---|---|
| `ProtectedRoute` | Shows spinner while `auth.loading`. Redirects to `/login?next=...` if no user. If `requireOrg` prop and user has zero orgs → redirect to `/create-org`. If has orgs but no `activeOrg` set → set first available. |
| `GuestOnlyRoute` | Redirects to `/app/dashboard` if user is logged in. |
| `OrgRoleRoute` | `roles` prop is array of allowed org roles. Renders 403 page if `currentMembership.role` not in list. |
| `SuperAdminRoute` | Combines `ProtectedRoute` + checks `user.platformRole === 'superadmin'`. |

### `next` redirect handling

`ProtectedRoute` reads the current URL and appends `?next=<encoded path>` to the login redirect. After login, the user is sent back to the originally requested URL.

### Permissions helper (`client/src/utils/permissions.js`)

```js
export const can = (membership, permission) => {
  const PERMS = { /* mirror of server PERMISSIONS map */ };
  return PERMS[permission]?.includes(membership?.role);
};

export const usePermissions = () => {
  const { currentMembership } = useOrg();
  return { can: (p) => can(currentMembership, p) };
};
```

**SECURITY:**
- All guards show a loading spinner during async auth checks (no flash of unauthorized content).
- Org-scoped routes verify both auth AND active org membership.
- Super admin route double-checks platform role client-side; backend remains the source of truth.

---

## STEP 26 — Auth Pages & Org Creation Wizard

### `LoginPage`

- Centered card on `AuthLayout`
- Form: email, password (with show/hide toggle), submit button
- Link: "Don't have an account? Register"
- On submit: `auth.login(email, password)`, then on success: if user has orgs → `/app/dashboard`; else → `/create-org`. If `?next=` query present, navigate there.
- Show inline form errors from server response
- Disabled state + spinner on submit button while loading

### `RegisterPage`

- Form: name, email, password, confirm password
- Client validation: password ≥ 8, passwords match
- On success: navigate to `/create-org` (forced — every new user creates an org)
- Link: "Already have an account? Login"

### `CreateOrgPage`

- Multi-step wizard (3 steps with progress bar):
  1. **Basics** — Org name (required), description (optional). Slug preview generated client-side.
  2. **Logo** — Optional Cloudinary upload. Skip button.
  3. **Confirm** — Summary of name, slug preview, plan (`Free` by default). "Create Organization" button.
- On success: store new org in `OrgContext`, set as `activeOrg`, navigate to `/app/dashboard?onboarding=true` (which triggers STEP 27's onboarding overlay)
- Has a "Skip for now" link only if user already has orgs

**SECURITY:**
- Password input always uses `type="password"` by default; show toggle only reveals temporarily.
- Form submit disables during request to prevent double-submission.
- Server validates everything; client validation is for UX only.

---

## STEP 27 — First-Run Onboarding Flow

After org creation, show a one-time onboarding wizard to guide the user through key product features. Tracked server-side via `user.hasCompletedOnboarding` (added in STEP 3).

### `OnboardingWizard` component (`client/src/components/onboarding/OnboardingWizard.jsx`)

Modal-style overlay with 3-4 steps:

1. **Welcome** — "Welcome, {name}! Let's set up {orgName}." Brief overview of what the product does.
2. **Invite your first teammate** — pre-filled email field, role selector. "Send invite" calls the invitation API. "Skip for now" advances.
3. **Customize your dashboard** — light text describing the dashboard. Auto-advances after 3 seconds or on click.
4. **You're all set** — "Explore your dashboard" CTA → calls `authService.completeOnboarding()` → closes modal → navigates to `/app/dashboard`.

Each step has:
- Progress dots at top
- Skip link (top-right) — also calls `completeOnboarding()`
- Back / Next buttons (Back disabled on first step)

### Trigger logic

In `OrgLayout.jsx` (or `App.jsx`), on mount check:

```jsx
const showOnboarding = user && !user.hasCompletedOnboarding && currentMembership?.role === 'owner';
```

Render `<OnboardingWizard />` when `showOnboarding` is true. Only owners see onboarding (members joining via invite already understand the product context from the invitation email).

### Empty-state nudges (after onboarding)

Even after onboarding completes, show contextual hints when relevant:
- Members page with only the owner → empty state CTA "Invite your first teammate" linking to invite modal.
- Activity page with no entries → "Activity will appear here as your team works."
- Billing page on free plan → small banner "Upgrade to Pro for advanced features."

### Server endpoint (already in STEP 3)

```
POST /api/auth/me/complete-onboarding → protect, completeOnboarding
```

**SECURITY:**
- Onboarding state stored server-side (`user.hasCompletedOnboarding`) — not just localStorage — so a user can't trivially re-trigger it on another device.
- The "Send invite" step in onboarding hits the same hardened invitation endpoint as the regular Members page (rate-limited, validated, RBAC-checked).
- No sensitive data displayed in the welcome step (just user name + org name, which are already known to the user).

---

## STEP 28 — Invitation Accept Page

### `AcceptInvitePage` (`client/src/pages/invite/AcceptInvitePage.jsx`)

- Reads `token` from URL query
- On mount: calls `invitationService.getInvitationByToken(token)` (public route)
- Shows preview card:
  - Org logo + name
  - Inviter name + "has invited you to join as **{role}**"
  - Email this invite was sent to
  - Expiry date
- If invitation not found / expired / revoked → show appropriate message
- Three flows based on auth state:
  - **Not logged in:** Show "Login" and "Register" buttons. Both pre-fill the email field. After auth, return to this page (use `?next=` redirect).
  - **Logged in but email mismatch:** Show "This invitation was sent to <email>. You're logged in as <currentEmail>. Please log out and login with the correct account."
  - **Logged in with matching email:** Show "Accept Invitation" button. On click → `acceptInvitation({ token })`. On success: refresh `OrgContext.orgs`, switch to the new org, navigate to `/app/dashboard`. Show success toast.

**SECURITY:**
- Token never displayed on screen.
- Email match enforced server-side; client just shows a friendly message.
- Public preview returns no sensitive data.

---

## STEP 29 — Dashboard Page (KPIs + Recharts)

### `DashboardPage`

Layout: 12-column responsive grid.

- **Header row:** Greeting (`Good {morning/afternoon/evening}, {name}`) + current org name + plan badge
- **KPI cards row** (4 cards): Total Members, Pending Invitations, Activities (7d), Monthly Revenue
  - Each `KpiCard` takes `{ icon, label, value, trend, isMock }`
  - Mock cards display a tiny `(Sample)` label
- **Charts row** (2 columns on desktop):
  - `<GrowthChart />` — Recharts `<AreaChart>` showing active users trend (mock)
  - `<RevenueChart />` — Recharts `<BarChart>` showing revenue per day (mock)
- **Activity chart row** (full width):
  - `<ActiveUsersChart />` — `<LineChart>` showing real activity events per day (last 30 days)
- **Recent activity widget:** scrollable list of last 10 activity entries (real)

Wrap each chart in a `<Suspense>` boundary (lazy-loaded — see STEP 40) and an individual error boundary so a broken chart doesn't take down the page.

### Recharts setup

- `<ResponsiveContainer width="100%" height={300}>`
- Tailwind-aware colors via CSS variables
- Tooltips, gridlines, legend per chart

### Data fetching

`useEffect` + `dashboardService.getOverview()` on mount. Refetch when `activeOrg._id` changes. Skeleton loaders while loading.

**SECURITY:**
- All data scoped to active org via `x-org-id` header.
- No user input on this page (read-only).

---

## STEP 30 — Members Page

### `MembersPage`

- Header: "Members" + "Invite Member" button (only visible if `members:invite`)
- Stats strip: total members, pending invitations, seats used / limit (progress bar)
- Tabs: "Active Members" | "Pending Invitations"
- **Members table** (`MembersTable.jsx`):
  - Columns: Avatar+Name, Email, Role (with `RoleBadge`), Joined Date, Actions
  - Actions menu: "Change Role", "Remove"
  - Disable actions for self and for owners
  - Search input (debounced 300ms)
- **Pending Invitations table:**
  - Columns: Email, Role, Invited By, Sent Date, Expires, Actions
  - Actions: "Resend", "Revoke"
- **Invite Member modal:** email, role select, submit; on success refetch list

### Optimistic updates

When changing a role, immediately update the UI; revert on error. Same for remove.

**SECURITY:**
- All actions hit backend endpoints that re-verify permissions.
- Role select excludes `owner`.
- Self-actions disabled in UI (server also blocks).

---

## STEP 31 — Team Activity Page

### `ActivityPage`

- Header: "Team Activity"
- Filters bar: action type (multi-select), actor (dropdown of org members), date range
- Activity feed: timeline-style list, grouped by day
- Each entry: actor avatar + formatted message
- Infinite scroll OR "Load more" button (paginated, 20 per page)
- Empty state: friendly illustration + "No activity yet"
- Real-time: when `activity:new` event arrives via Socket.io, prepend to list with brief highlight animation

### Activity message formatter

```js
export const formatActivity = (log) => {
  const actor = log.actorId?.name || 'Someone';
  switch (log.action) {
    case 'member.invited':    return `${actor} invited ${log.metadata.email} as ${log.metadata.role}`;
    case 'member.joined':     return `${actor} joined the organization`;
    case 'member.role_changed': return `${actor} changed ${log.metadata.targetName}'s role to ${log.metadata.newRole}`;
    case 'billing.plan_changed': return `${actor} changed the plan to ${log.metadata.newPlan}`;
    default: return `${actor} performed ${log.action}`;
  }
};
```

Cover every action in the `ACTIVITY_ACTIONS` enum.

**SECURITY:**
- All activity data scoped to active org server-side.
- No write actions.

---

## STEP 32 — Billing & Plan Page

### `BillingPage` (owner only — route guard)

- **Current Plan section:** `PlanCard` showing plan name, price, features, seats used / limit
- **Plans comparison:** Free vs Pro side-by-side, highlight current plan, "Switch to {plan}" button
- **Plan change confirmation modal:** Summary; for downgrade, warning if seat count exceeds new limit; confirm → `changePlan({ newPlan })`
- **Billing History section:** `BillingHistoryTable` with columns: Invoice #, Date, Description, Amount, Status, Actions ("View")
- **Mock indicator banner:** "This is a demo billing system — no real payments are processed."

**SECURITY:**
- Page guarded by `OrgRoleRoute roles={['owner']}`.
- Backend re-verifies `org:billing` permission.
- Downgrade preflight check on backend prevents seat overflow.

---

## STEP 33 — Org Settings Page

### `OrgSettingsPage`

Side-nav (within page):
- **General** (admin+): Name, description, logo upload (drag & drop)
- **Members link** (link out to Members page)
- **Slug & URL** (read-only)
- **Danger Zone** (owner only):
  - Transfer Ownership (member picker + password confirmation)
  - Delete Organization (requires typing org name + password)

Each section has its own `Save` button. Optimistic updates with rollback on error.

**SECURITY:**
- General save requires `members:update` (admin+).
- Danger Zone requires owner role + extra confirmation.
- Logo upload via `uploadOrgLogo` then PATCH org with returned URL.

---

## STEP 34 — Account Settings Page

### `AccountSettingsPage`

Side-nav sections:
- **Profile**: name, avatar upload, email (read-only)
- **Password**: current, new, confirm
- **Appearance**: theme picker (light/dark/system) — wired to `ThemeContext`
- **Organizations**: list with role badges; "Leave organization" per org (disabled for owner)
- **Danger Zone**: Delete Account (requires password)

**SECURITY:**
- Password change requires current password.
- Account delete requires password.
- Email field disabled — preventing account hijack via email change.

---

## STEP 35 — Notifications UI (Bell + Toast)

Most wired in STEPS 21 and 24. This step focuses on UX polish.

### Notification Bell dropdown

- Latest 10 notifications
- Each item: icon (per type), title, message, relative time, unread dot
- Click → marks as read + navigates to `notification.link`
- Footer: "Mark all as read" + "View all"

### Toast notifications

- `<Toaster />` mounted in `App.jsx`, position `top-right`, duration 5s
- On `notification:new` socket event:
  - Add to `NotificationContext`
  - Trigger `toast.success(title)` with custom render showing avatar + message

**SECURITY:**
- Notifications carry only the user's own data (server-enforced).
- Click navigation only to client-side routes — no external URLs.

---

## STEP 36 — Global Search Command Palette

A keyboard-driven, cross-resource search modal triggered by Cmd+K / Ctrl+K. Calls the search API from STEP 14.

### `CommandPalette` component (`client/src/components/layout/CommandPalette.jsx`)

- Mounted at the layout level so it's available on every authenticated page.
- Trigger: `useHotkey('mod+k', () => setOpen(true))`. Also opened by the Topbar search button.
- Modal with:
  - Search input (autofocused on open)
  - Loading spinner inside the input while fetching
  - Grouped results: **Members**, **Invitations**, **Activity**
  - Each group shows up to 5 hits with an icon, primary text, secondary text
  - Empty state: "No results for '{q}'"
  - Initial state (empty input): show recent searches stored in localStorage (max 5) + a list of quick links ("Go to Dashboard", "Open Members", "Open Settings")
  - Footer keyboard hints: `↑↓ navigate`, `↵ select`, `esc close`

### Behavior

- Debounce input by 200 ms before calling `searchService.globalSearch(q)`.
- Keyboard navigation: arrows move highlight across all groups; Enter activates the highlighted item.
- Selecting a result navigates to a sensible destination:
  - Member → `/app/members?focus=<id>`
  - Invitation → `/app/members?tab=pending&focus=<id>`
  - Activity → `/app/activity?focus=<id>`
- ESC closes; clicking the backdrop closes.
- Recent searches stored in `localStorage.saas:recentSearches` (max 5, deduplicated, queries only — never results).

### Accessibility

- Modal traps focus while open and restores focus to the trigger on close.
- Search input has `aria-autocomplete="list"` and the listbox uses `role="listbox"` with `role="option"` items.
- Highlighted item announced via `aria-activedescendant`.

**SECURITY:**
- All queries hit the rate-limited `/api/search` endpoint (STEP 14).
- Recent searches are local-only and never sent to the server.
- No `dangerouslySetInnerHTML` when rendering match snippets — use plain text + Tailwind highlighting only.
- Result navigation only goes to internal client routes (never external URLs derived from server responses).

---

## STEP 37 — Super Admin Pages

Visible only to users with `platformRole === 'superadmin'`. Use `AdminLayout`.

### `SuperAdminDashboardPage`

- KPI cards: Total Users, Total Orgs, Active Subscriptions, Signups (30d)
- Charts: signup trend (real), org distribution by plan (real, pie chart)
- Recent platform activity (cross-org)

### `AllOrgsPage`

- Table: Name, Slug, Plan, Members, Owner, Created, Status, Actions
- Search + filters (plan, status)
- Actions: View Details, Suspend/Restore, Force Delete (with double confirm)

### `AllUsersPage`

- Table: Avatar+Name, Email, Platform Role, Active, Orgs Count, Created, Actions
- Search + filters
- Actions: Toggle Active, Promote/Demote (Super Admin), View Memberships
- Self-actions disabled
- Last super admin demote blocked at UI level (button disabled with tooltip)

**SECURITY:**
- Page guarded by `SuperAdminRoute` (client) + `superAdminOnly` (server).
- All destructive actions require explicit confirmation.
- Backend enforces self-protection and last-super-admin protection.

---

## STEP 38 — UX Enhancements & Reusable Components

### Reusable component library (`client/src/components/common/`)

| Component | Props | Purpose |
|---|---|---|
| `Spinner` | `size`, `color` | Loading spinner |
| `Button` | `variant`, `size`, `loading`, `disabled`, `icon` | Standard button |
| `Input` | `label`, `error`, `icon`, native props | Form input |
| `Select` | `label`, `options`, `error` | Form select |
| `Modal` | `isOpen`, `onClose`, `title`, `children`, `size` | Centered modal w/ backdrop, ESC, focus trap |
| `ConfirmModal` | `isOpen`, `onConfirm`, `onCancel`, `title`, `message`, `confirmLabel`, `confirmVariant`, `requireText` | Confirmation w/ optional text-match challenge |
| `Badge` | `variant`, `children` | Generic colored badge |
| `RoleBadge` | `role` | Color-coded by role |
| `PlanBadge` | `plan` | Free=gray, Pro=gradient |
| `Avatar` | `src`, `name`, `size` | Image with initials fallback |
| `Pagination` | `page`, `totalPages`, `onChange` | Pagination control |
| `EmptyState` | `icon`, `title`, `message`, `action` | Friendly empty state |
| `ThemeToggle` | — | Theme cycler (STEP 22) |

### Loading & error patterns

- Every async page mounts in a loading state; show skeleton placeholders or `<Spinner />` centered.
- All API errors caught and shown via `toast.error(err.response?.data?.message || 'Something went wrong')`.

### Responsive design

- Sidebar collapses on `<lg` (1024px) to a hamburger drawer.
- Tables become card lists on mobile (`<md`).
- Charts use `ResponsiveContainer`.

### Accessibility

- All interactive elements have visible focus rings.
- Modals trap focus and restore on close.
- Form inputs always paired with `<label>`.
- Color contrast meets WCAG AA in both light and dark themes.
- Icons used decoratively have `aria-hidden`.

---

## STEP 39 — 404, Route Guards & Org Switcher Refinement

### `NotFoundPage`

- Large 404 illustration or text
- Friendly message: "We can't find what you're looking for."
- Button: "Go to Dashboard" (or "Login" if unauthenticated)

### Route guard refinements

- `ProtectedRoute`: while `auth.loading`, render full-page `<Spinner />` (no redirect).
- After login, restore intended route via `?next=` query param.
- `OrgRoleRoute`: render a "403 — You don't have permission" page (not just blank).
- Org switcher: when switching orgs, briefly show a loading overlay until new org's data loads.

### Org switcher edge cases

- User in zero orgs → all `/app/*` routes redirect to `/create-org`.
- User leaves the active org → automatically switch to first available org or redirect to `/create-org`.
- User's role changes mid-session → refetch org data on next request; consider listening to a Socket.io `membership:updated` event to refetch immediately.

---

## STEP 40 — Performance Optimization & Code Splitting

### Route-level code splitting

Convert page imports in `App.jsx` to `React.lazy`:

```jsx
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.jsx'));
const MembersPage = lazy(() => import('./pages/members/MembersPage.jsx'));
// ... etc.

<Suspense fallback={<FullPageSpinner />}>
  <Routes>{/* ... */}</Routes>
</Suspense>
```

This produces one JS chunk per page — first load only ships the auth + dashboard chunk.

### Component-level lazy loading

- **Recharts charts** in the dashboard: `lazy(() => import('./components/dashboard/RevenueChart.jsx'))` — Recharts is large.
- **Command palette**: lazy-load on first hotkey trigger.
- **Modals**: `Modal`, `ConfirmModal`, `InviteMemberModal` can be lazy if they're not used immediately.

### React optimization patterns

- `React.memo` on table rows and list items (`MembersTable` rows, `ActivityPage` entries).
- `useMemo` for derived data (e.g. filtered/sorted member lists, formatted activity messages).
- `useCallback` for handlers passed to memoized children.
- Avoid passing fresh object/array literals as props on every render.

### List virtualization (optional)

For activity feeds or super-admin tables that may grow large, integrate `react-window` (lightweight) and render only visible rows. Keep this opt-in — for the template's default volume (small orgs), pagination is sufficient.

### Image optimization

- Cloudinary `f_auto,q_auto` transformations for automatic format negotiation and quality.
- Responsive `srcset` for org logos and avatars in lists.
- `loading="lazy"` on all `<img>` tags below the fold.

### Bundle analysis

Add `vite-bundle-visualizer` (dev dep) and a script:

```json
"analyze": "vite-bundle-visualizer"
```

Run before each release to spot regressions. Target a main bundle ≤ 200 KB gzipped.

### API caching pattern

For data that doesn't change often (e.g. `getMyOrgs`), use a small SWR-style cache in the relevant context:

```js
const cache = new Map();
const TTL = 30_000;
export const getMyOrgsCached = async () => {
  const hit = cache.get('myOrgs');
  if (hit && Date.now() - hit.t < TTL) return hit.data;
  const data = await getMyOrgs();
  cache.set('myOrgs', { data, t: Date.now() });
  return data;
};
```

Invalidate on relevant mutations (`createOrg`, `leaveOrg`, role change).

**SECURITY:**
- Lazy-loaded chunks never contain auth-bypass logic — all auth checks remain on the server.
- Cached data does not include sensitive fields beyond what's already accessible.
- Bundle analyzer output (`stats.html`) is gitignored — never publish dependency tree details to a public repo.

---

## STEP 41 — Testing Setup (Vitest + Supertest + RTL)

A focused test suite that proves the highest-risk areas: auth, tenant isolation, and invitation flow. Plus a few smoke tests for critical UI components.

### Server testing

#### Setup file (`server/tests/setup.js`)

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, afterEach } from 'vitest';

let mongo;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterEach(async () => {
  for (const name of Object.keys(mongoose.connection.collections)) {
    await mongoose.connection.collections[name].deleteMany({});
  }
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
```

#### Vitest config (`server/vitest.config.js`)

```js
export default { test: { setupFiles: ['./tests/setup.js'], environment: 'node' } };
```

#### Helpers (`server/tests/helpers.js`)

- `createUser({ email, password, platformRole })` → returns `{ user, token }`
- `createOrgFor(user, { name })` → returns `{ org, membership }`
- `authedRequest(token)` → returns Supertest agent with `Authorization` header pre-set

#### Required test cases

| File | Tests |
|---|---|
| `auth.test.js` | register success; register duplicate email returns generic error; login success; login wrong password returns generic error; login non-existent email returns same generic error; password not in response; cannot set `platformRole` via register |
| `tenant.test.js` | user A in org X cannot fetch dashboard for org Y; super admin CAN access any org; missing `x-org-id` returns 400; invalid orgId format returns 400 |
| `invitations.test.js` | create invitation with seat available; reject when seat limit reached; cannot invite as 'owner'; accept with matching email succeeds; accept with wrong email rejected; accepted invitation cannot be reused; expired invitation rejected |
| `rbac.test.js` | member cannot delete a member; admin cannot demote owner; admin cannot demote another admin; owner can transfer ownership |
| `billing.test.js` | downgrade blocked when over seat limit; billing record created on plan change; non-owner cannot change plan |

### Client testing

#### Setup (`client/src/tests/setup.js`)

```js
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => cleanup());
```

#### Required test cases

| Component | Tests |
|---|---|
| `Button` | renders label; calls `onClick`; disabled state blocks click; loading shows spinner |
| `RoleBadge` | renders correct color for each role |
| `ConfirmModal` | requires text match when `requireText` set; calls `onConfirm` only when text matches |
| `LoginPage` | shows error toast on failed login; navigates on success (mocked router) |
| `MembersTable` | hides action menu for owner row when current user is admin |
| `OrgSwitcher` | calls `switchOrg` on selection |

Mock services with `vi.mock('../services/...')`. Use `MemoryRouter` for routing tests.

### Running tests

```bash
cd server && npm test
cd client && npm test
```

Aim for: 100% coverage on auth + tenant middleware; ~70% on controllers; smoke coverage on critical UI components.

**SECURITY:**
- Tests use `mongodb-memory-server` — never connect to a real DB.
- Test env uses isolated env vars (a `.env.test` file gitignored, OR programmatic `process.env` overrides in `setup.js`).
- No real Cloudinary, SMTP, or super-admin credentials in tests — mock or stub.
- Tests do not commit fixture data containing real PII.

---

## STEP 42 — CI/CD with GitHub Actions

Add a CI workflow that runs lint + tests on every push and PR. Free for public repos.

### Workflow file (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  server:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node }}, cache: npm, cache-dependency-path: server/package-lock.json }
      - run: npm ci
        working-directory: server
      - run: npm test
        working-directory: server
        env:
          NODE_ENV: test
          JWT_SECRET: test-secret-32-chars-minimum-aaaaaa
          MONGO_URI: mongodb://127.0.0.1/ignored

  client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: client/package-lock.json }
      - run: npm ci
        working-directory: client
      - run: npm run build
        working-directory: client
        env:
          VITE_API_URL: /api
      - run: npm test
        working-directory: client
```

### Dependabot config (`.github/dependabot.yml`)

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /server
    schedule: { interval: weekly }
  - package-ecosystem: npm
    directory: /client
    schedule: { interval: weekly }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: monthly }
```

### README badge

Add to README:
```markdown
![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)
```

### Future expansion (commented placeholders)

Document — but do not implement yet — these optional jobs:
- Lint job (ESLint + Prettier check)
- Coverage upload (Codecov)
- Auto-deploy to Render/Netlify on merge to main (requires service-specific tokens stored as GitHub secrets)

**SECURITY:**
- The workflow uses **placeholder env values** (`test-secret-32-chars-minimum-aaaaaa`) for tests — never real secrets.
- Tests use `mongodb-memory-server` — `MONGO_URI` is set to a dummy value but never used.
- No `echo ${{ secrets.* }}` anywhere — secrets only flow into env vars and never to logs.
- Dependabot keeps dependencies patched (security fixes auto-PR'd).
- Pin actions by major version (`@v4`) — for stricter posture, pin to commit SHAs.
- `pull_request` trigger from forks runs in a sandbox; secrets are not exposed to PRs from forks (GitHub's default behavior).

---

## STEP 43 — README & Documentation

Create `README.md` in the project root.

### Sections

1. **Title + tagline** — "SaaS Dashboard Template — Multi-tenant React + Node SaaS starter"
2. **Badges** — License, CI status, stack badges (React, Node, MongoDB, TailwindCSS)
3. **Screenshots placeholder** — references like `<!-- ./docs/screenshots/dashboard.png -->`
4. **Features** — bullet list (multi-tenancy, RBAC, invitations, billing mock, real-time notifications, command palette, dark mode, super admin, etc.)
5. **Multi-Tenant Architecture** — short paragraph: Users belong to multiple Orgs via Memberships; every API request carries an org context (`x-org-id` header); the `tenantContext` middleware enforces isolation on every query.
6. **Roles & Permissions table:**

   | Role | Org Settings | Invite | Change Roles | Remove Members | Billing | Delete Org |
   |---|---|---|---|---|---|---|
   | Super Admin | Read all (cross-org) | (cross-org) | (cross-org) | (cross-org) | (cross-org) | (cross-org) |
   | Owner | Yes | Yes | Yes | Yes | Yes | Yes |
   | Admin | Yes | Yes | Yes (except owners) | Yes (except owners) | Read-only | No |
   | Member | Read-only | No | No | No | No | No |

7. **Invitation Flow Diagram:**
   ```
   Admin clicks "Invite" → POST /api/invitations
                        → uuid token generated
                        → email sent (Nodemailer + branded HTML template)
                        → recipient clicks link → /invite/accept?token=...
                        → AcceptInvitePage shows preview
                        → user logs in / registers → POST /api/invitations/accept
                        → Membership created, org seats++
                        → notification dispatched via Socket.io
   ```
8. **API Documentation** — link to `/api/docs` (in dev) plus a brief overview of major endpoint groups.
9. **Tech Stack** — list of all major dependencies with versions.
10. **Folder Structure** — tree diagrams for `server/` and `client/`.
11. **Getting Started:**
    - Prerequisites (Node 20+, MongoDB, Cloudinary account, SMTP creds)
    - Server: `cd server && npm install && cp .env.example .env`
    - `npm run seed:admin`
    - `npm run dev`
    - Client: `cd client && npm install && cp .env.example .env`
    - `npm run dev`
    - Visit `http://localhost:5173`
12. **Environment Variables** — full list with descriptions.
13. **Testing** — `npm test` for both server and client.
14. **CI/CD** — explanation of the GitHub Actions workflow.
15. **Security** — bullet list of all hardening measures.
16. **Theming** — note about light/dark/system theme system.
17. **Deployment** — Render + Netlify + Cloudinary + MongoDB Atlas. Step-by-step.
18. **How to use as a Template** — instructions for renaming, rebranding, adding new resource models, extending the role enum.
19. **Mock Billing Note** — explicit statement that the billing system is mock-only.
20. **Contributing** — quick guide if accepting external PRs.
21. **License** — MIT.

### Add a `LICENSE` file

Standard MIT license file at the repo root. This is the second-most-important file after `.gitignore` for a public template.

---

## STEP 44 — Code Cleanup & Pre-Publish (Public GitHub) Audit

This step is **mandatory** before clicking "Publish repository" in GitHub Desktop. The repository will be **public** — assume every line is read by automated secret scanners (TruffleHog, GitGuardian, GitHub Secret Scanning) the moment it goes live.

### Part A — Code quality cleanup

- [ ] All `console.log` statements removed; `logger.*` used throughout
- [ ] Unused imports removed (`eslint --fix` if ESLint is configured)
- [ ] All `// TODO` and `// FIXME` comments resolved or moved to GitHub issues (after the repo exists)
- [ ] No commented-out blocks of code left behind
- [ ] All toast/error messages in English with consistent voice
- [ ] All form validation messages user-friendly (no Mongoose error leakage)
- [ ] No raw error responses leak field names, file paths, or stack traces in production
- [ ] localStorage keys namespaced (`saas:token`, `saas:activeOrgId`, `saas:theme`, `saas:recentSearches`)
- [ ] All API error responses use the unified `{ success, message }` shape
- [ ] No hard-coded URLs in client code (use `import.meta.env.VITE_API_URL`)
- [ ] No hard-coded URLs in server code (use `env.CLIENT_URL`)
- [ ] All routes have rate limiters mounted
- [ ] Mongo indexes are created (rely on Mongoose `autoIndex: true` in dev; `Model.syncIndexes()` for first prod boot)
- [ ] Super admin seed has been tested locally
- [ ] Tests pass (`npm test` in both `server/` and `client/`)

### Part B — Secret hygiene scan (search the repo before every publish)

Run these searches across the entire project tree (`server/` + `client/` + root). **None should return matches in tracked files.**

- [ ] **Mongo connection strings:** search for `mongodb+srv://` and `mongodb://` — should only appear in `.env.example` placeholder
- [ ] **JWT secrets:** search for any string longer than 32 chars that looks like a hash/secret — only in `.env.example` as obvious placeholder text
- [ ] **Bearer tokens:** search for `Bearer ey` (start of a JWT) — only in documentation as illustration
- [ ] **Cloudinary signatures:** search for your real cloud name, real API key, real secret — must not appear anywhere except your local `.env`
- [ ] **SMTP passwords:** search for your real SMTP user/pass — must not appear in code, tests, or comments
- [ ] **Email addresses:** search for your personal email — should not appear in seeds, fixtures, README, or comments
- [ ] **Hardcoded passwords:** search for `password:`, `password =`, `password="`, `pwd:` — flag every match
- [ ] **API key patterns:** search for `sk_live`, `sk_test`, `pk_live`, `pk_test`, `xoxb-`, `ghp_`, `AKIA` — none in tracked files
- [ ] **Internal URLs:** search for `localhost:`, `127.0.0.1`, `192.168.`, your Render/Netlify project URLs — only in `.env.example` or documentation
- [ ] **`process.env` defaults:** grep for `process.env.[A-Z_]+ \|\| ['"]` — every match must use a safe non-secret default

### Part C — Filesystem audit before publishing

Before opening GitHub Desktop:

- [ ] GitHub Desktop "Changes" tab does **not** show `.env`, `.env.local`, `.env.production`, or any other env file
- [ ] `node_modules/` is not listed
- [ ] `uploads/` is not listed
- [ ] `dist/` and `build/` directories are not listed
- [ ] `coverage/` and `.nyc_output/` are not listed
- [ ] No `*.pem`, `*.key`, `*.crt`, `*.p12` files
- [ ] No `.DS_Store`, `Thumbs.db` files
- [ ] No `tmp/email-previews/` or other test artifact folders
- [ ] No `stats.html` or other bundle-analyzer output
- [ ] No personal screenshots in `docs/`
- [ ] `.env.example` IS staged (this one SHOULD be tracked)
- [ ] `.gitignore` IS staged
- [ ] `LICENSE` file exists
- [ ] `README.md` exists and contains no internal/private info
- [ ] `.github/workflows/ci.yml` exists and uses no real secrets
- [ ] `.github/dependabot.yml` exists

### Part D — End-to-end functional smoke test

- [ ] Test the full flow on localhost: register → create org → onboarding wizard → invite teammate → accept (in incognito) → role change → upgrade plan → notification received → super admin view
- [ ] Confirm SMTP emails arrive (Mailtrap inbox or real mailbox) and templates render correctly
- [ ] Confirm Socket.io connects and emits notifications in real time
- [ ] Confirm Cloudinary uploads succeed and deliver via HTTPS
- [ ] Confirm `npm run seed:admin` works without errors
- [ ] Confirm `Cmd+K` opens the command palette and search returns results
- [ ] Confirm dark mode toggle works without FOUC
- [ ] Confirm error boundary catches a deliberately thrown render error and shows the fallback

### Part E — Post-publish verification

After publishing the repository on GitHub:

- [ ] Browse the repo on github.com and visually scan every file in `server/config/`, `server/seed/`, root, and any `.env*` matches
- [ ] Use **GitHub's built-in Security → Secret scanning alerts** (Settings → Code security and analysis) — enable "Secret scanning" and "Push protection"
- [ ] Search the public repo for your real email and Cloudinary cloud name — there should be zero hits
- [ ] Verify the CI badge in README turns green after the first push
- [ ] If anything sensitive slipped through: **rotate the secret immediately** on the provider, then remove it from history with `git filter-repo` or BFG Repo Cleaner

> **If a secret leaks**, deleting the file from the latest commit is **not enough** — it lives in git history forever (and in GitHub's caches). The only safe response is: rotate the secret on the provider, force-overwrite history (advanced), and treat the leaked value as permanently compromised.

---

## STEP 45 — Deployment (Render + Netlify + Cloudinary)

### MongoDB Atlas

1. Create a free cluster at `cloud.mongodb.com`.
2. Create a database user with a **strong password** (16+ chars, mixed).
3. Network Access: whitelist Render's static outbound IPs (Render docs list current IPs); use `0.0.0.0/0` only as a temporary measure.
4. Get the connection string (`mongodb+srv://...`) — use as `MONGO_URI`.

### Cloudinary

1. Sign up at `cloudinary.com`.
2. From the dashboard, copy `cloud_name`, `api_key`, `api_secret`.
3. Set in Render env vars.

### SMTP (Email)

For dev: Mailtrap (`smtp.mailtrap.io`).
For production: Resend, Postmark, or SendGrid.

### Version control (manual, via GitHub Desktop) — Public repository workflow

No git commands are executed during development. The repository is published as **public** on GitHub via **GitHub Desktop** only after STEP 44's pre-publish audit passes.

**Pre-publish workflow:**

1. Complete **STEP 44 — every checkbox** (especially Parts B and C: secret scan + filesystem audit). Do not skip this.
2. Open **GitHub Desktop** and add the project folder as a local repository.
3. In the **Changes** tab, scan the file list:
   - Confirm `.env` is **NOT** listed.
   - Confirm `node_modules/` is **NOT** listed.
   - Confirm `dist/`, `build/`, `uploads/`, `logs/` are **NOT** listed.
   - Confirm `.env.example`, `.gitignore`, `LICENSE`, `README.md`, `.github/workflows/ci.yml` **ARE** listed.
4. Make an initial commit with a clean message (e.g. `Initial commit`). Do not include secrets or internal URLs in the message.
5. Click **Publish repository**. In the dialog:
   - **Uncheck** "Keep this code private" (this project is intended to be public).
   - Confirm the repository name and description contain no sensitive info.
6. After publishing, **immediately** browse the repo on github.com and visually scan for leaks.
7. Enable **GitHub Secret Scanning + Push Protection** in repo Settings → Code security and analysis.
8. Confirm the CI workflow runs and badge turns green.
9. Only after the public repo is clean, connect Render and Netlify to it for auto-deploys.

### Backend deployment (Render)

1. Ensure the `server/` folder lives inside a GitHub repository (published manually via GitHub Desktop).
2. On Render: **New → Web Service** → connect the repository → root directory `server/`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment variables (set ALL):
   - `NODE_ENV=production`
   - `MONGO_URI=...`
   - `JWT_SECRET=` (generate via `openssl rand -base64 48` — must be ≥ 32 chars)
   - `JWT_EXPIRES_IN=7d`
   - `CLIENT_URL=https://your-app.netlify.app` (strict origin)
   - `CLOUDINARY_CLOUD_NAME=...`, `CLOUDINARY_API_KEY=...`, `CLOUDINARY_API_SECRET=...`
   - `EMAIL_HOST=...`, `EMAIL_PORT=587`, `EMAIL_USER=...`, `EMAIL_PASS=...`, `EMAIL_FROM="SaaS Dashboard <noreply@yourdomain.com>"`
   - `LOG_LEVEL=info`
   - `EXPOSE_DOCS_IN_PROD=false`
   - `SUPER_ADMIN_EMAIL=...`, `SUPER_ADMIN_PASSWORD=` (rotate after first login)
6. Deploy. After first deploy, open the Render Shell and run `npm run seed:admin` to create the super admin.
7. Note the public URL.

### Frontend deployment (Netlify)

1. Ensure the `client/` folder lives inside the same GitHub repository.
2. On Netlify: **New site from Git** → select the repository → base directory `client/`.
3. Build command: `npm run build`
4. Publish directory: `client/dist`
5. Environment variables: `VITE_API_URL=https://saas-api.onrender.com/api`
6. SPA redirects — create `client/public/_redirects`:
   ```
   /*    /index.html   200
   ```
7. Deploy. Note the public URL.
8. Go back to Render and **update `CLIENT_URL`** to this Netlify URL. Redeploy backend.

### Post-deploy verification

#### Functional checklist

- [ ] Register a new account on production
- [ ] Create an organization; complete onboarding
- [ ] Upload an org logo (Cloudinary delivery URL works)
- [ ] Invite a teammate via email — they receive the email with branded template
- [ ] Accept the invitation in another browser/account
- [ ] Switch between two orgs — data isolation confirmed
- [ ] Change a member's role — affected user receives a real-time notification
- [ ] Upgrade plan from Free to Pro — billing record created
- [ ] View billing history — invoice number shown
- [ ] Use Cmd+K command palette — results returned
- [ ] Toggle dark mode — persists across reloads
- [ ] Super admin login → see all orgs → suspend an org → verify it's hidden from the regular user
- [ ] Logout works; redirected to `/login`

#### Security checklist

- [ ] Rate limiting active: try 11 logins in a row, get 429
- [ ] CORS blocks requests from an unknown origin
- [ ] Error responses hide internals — try a malformed request, confirm no Mongoose stack trace
- [ ] Helmet headers present: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`
- [ ] NoSQL injection blocked: try `email: { "$gt": "" }` in login body
- [ ] XSS sanitized: register with `<script>alert(1)</script>` as name — stored escaped
- [ ] Role escalation blocked: `PATCH /api/auth/me` with `{ platformRole: 'superadmin' }` — silently ignored
- [ ] Tenant isolation: get a JWT for User A in Org X, try `GET /api/dashboard/overview` with `x-org-id` of Org Y where they aren't a member — 403
- [ ] Auth-required routes reject unauthenticated requests
- [ ] Invitation token cannot be reused after acceptance
- [ ] Email-XSS prevented: register with `<img onerror>` payload — invitation email renders as escaped text
- [ ] `/api/docs` returns 404 in production (since `EXPOSE_DOCS_IN_PROD=false`)
- [ ] Cloudinary URLs are HTTPS
- [ ] No `.env` file deployed (verify build output)
- [ ] SUPER_ADMIN_PASSWORD has been rotated after first login
- [ ] CI badge is green; latest workflow run shows no errors

#### Final note

After confirming all checks, the SaaS Dashboard Template is ready to use as the foundation for any multi-tenant product, or to be packaged as a starter template. Update the README with screenshots of your deployed instance and consider adding a demo video. The template is now production-grade, public-repo safe, and battle-tested across 45 incremental, security-conscious build steps.
