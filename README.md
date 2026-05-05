# SaaS Dashboard Template

Multi-tenant React + Node SaaS starter with organizations, memberships, RBAC, invitations, mock billing, real-time notifications, dark mode, and a super admin area.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css&logoColor=white)

<!-- Enable after publishing by replacing <owner>/<repo>:
![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)
-->

## Screenshots

Screenshots can be added under `docs/screenshots/` after the UI is finalized.

<!-- ./docs/screenshots/dashboard.png -->
<!-- ./docs/screenshots/members.png -->
<!-- ./docs/screenshots/billing.png -->

## Features

- Multi-tenant organization model with user memberships.
- Role-based access control for owners, admins, members, and platform super admins.
- Invitation flow with UUID tokens, email delivery, preview, acceptance, and seat tracking.
- Mock billing with Free and Pro plans, billing history, and invoice records.
- Real-time notifications powered by Socket.io.
- Dashboard metrics and charts for activity, growth, and revenue.
- Command palette and global organization search.
- Light, dark, and system theme support.
- Super admin area for platform-level organization and user management.
- Swagger-powered API docs in development.
- Cloudinary-backed avatar and organization logo uploads.
- Focused server and client test suites with Vitest.

## Multi-Tenant Architecture

Users can belong to multiple organizations through `Membership` records. Each organization-scoped API request carries the active organization in the `x-org-id` header. The `tenantContext` middleware resolves the membership, attaches tenant data to the request, and keeps organization-specific queries isolated.

## Roles And Permissions

| Role | Org Settings | Invite | Change Roles | Remove Members | Billing | Delete Org |
|---|---|---|---|---|---|---|
| Super Admin | Read all cross-org data | Cross-org management | Cross-org management | Cross-org management | Cross-org overview | Force delete / restore |
| Owner | Yes | Yes | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes, except owners | Yes, except owners | Read-only in UI | No |
| Member | Read-only | No | No | No | No | No |

## Invitation Flow

```text
Admin clicks "Invite" -> POST /api/invitations
                     -> uuid token generated
                     -> email sent with Nodemailer and branded HTML template
                     -> recipient clicks /invite/accept?token=...
                     -> AcceptInvitePage shows preview
                     -> user logs in or registers
                     -> POST /api/invitations/accept
                     -> Membership created and org seats incremented
                     -> notification dispatched via Socket.io
```

## API Documentation

When the server runs in development, Swagger UI is available at:

```text
http://localhost:5000/api/docs
```

The OpenAPI JSON document is available at:

```text
http://localhost:5000/api/docs.json
```

Major endpoint groups:

- `Auth`: register, login, profile, password, onboarding, and account deletion.
- `Organizations`: create organizations, list current user's organizations, update settings, and delete organizations.
- `Memberships`: list members, role updates, member removal, leaving organizations, and ownership transfer.
- `Invitations`: create, list, preview by token, accept, revoke, and resend invitations.
- `Dashboard`: overview metrics and chart data.
- `Activities`: organization activity logs and activity stats.
- `Billing`: current plan, plan changes, billing history, and invoice lookup.
- `Notifications`: notification list, unread count, read state updates, and deletion.
- `Search`: tenant-scoped global search.
- `Uploads`: avatar and organization logo uploads.
- `Super Admin`: platform stats, organizations, users, suspension, restore, and force delete flows.

## Tech Stack

### Client

- React `^19.2.5`
- React Router DOM `^7.14.2`
- Vite `^8.0.10`
- Tailwind CSS `^4.2.4`
- Axios `^1.15.2`
- Socket.io Client `^4.8.3`
- Recharts `^3.8.1`
- Lucide React `^1.14.0`
- React Hot Toast `^2.6.0`
- Vitest `^4.1.5`
- Testing Library

### Server

- Node.js `20+`
- Express `^5.2.1`
- Mongoose `^9.6.1`
- JWT `^9.0.3`
- bcryptjs `^3.0.3`
- Socket.io `^4.8.3`
- Nodemailer `^8.0.7`
- Cloudinary `^2.10.0`
- Helmet `^8.1.0`
- express-rate-limit `^8.4.1`
- express-validator `^7.3.2`
- Swagger UI Express `^5.0.1`
- Pino `^10.3.1`
- Vitest `^4.1.5`
- Supertest `^7.2.2`
- mongodb-memory-server `^11.1.0`

## Folder Structure

### Server

```text
server/
  config/          Environment, database, logger, Cloudinary, Swagger
  controllers/     Request handlers
  middleware/      Auth, tenant context, RBAC, validation, security
  models/          Mongoose models
  routes/          Express route modules
  scripts/         Local utility scripts
  seed/            Super admin seed script
  services/        Email, activity, notification, socket services
  tests/           Server tests
  utils/           Shared server helpers and constants
  index.js         Express and Socket.io bootstrap
```

### Client

```text
client/
  src/
    api/           Axios instance
    components/    Reusable UI and feature components
    context/       Auth, org, socket, notification, theme providers
    hooks/         Reusable React hooks
    layouts/       Auth, admin, and organization layouts
    pages/         Route-level pages
    routes/        Route guards and routing helpers
    services/      API service modules
    tests/         Client tests
    utils/         Permissions and formatting helpers
    App.jsx        App shell
    main.jsx       React entry point
```

## Getting Started

### Prerequisites

- Node.js `20+`
- MongoDB locally or MongoDB Atlas
- Cloudinary account for uploads
- SMTP credentials for invitation emails

### Server

```bash
cd server
npm install
cp .env.example .env
npm run seed:admin
npm run dev
```

The API runs on `http://localhost:5000` by default.

### Client

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` in your browser.

## Environment Variables

### Server

| Variable | Description |
|---|---|
| `PORT` | API port. Defaults to `5000`. |
| `NODE_ENV` | Runtime environment: `development`, `test`, or `production`. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | JWT signing secret. Use at least 32 characters in production. |
| `JWT_EXPIRES_IN` | JWT lifetime. Defaults to `7d`. |
| `CLIENT_URL` | Frontend URL used for CORS and invitation links. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `EMAIL_HOST` | SMTP host. |
| `EMAIL_PORT` | SMTP port. Defaults to `587`. |
| `EMAIL_USER` | SMTP username. |
| `EMAIL_PASS` | SMTP password. |
| `EMAIL_FROM` | Sender identity for outgoing emails. |
| `LOG_LEVEL` | Pino log level, for example `debug` or `info`. |
| `EXPOSE_DOCS_IN_PROD` | Set to `true` only if Swagger docs should be exposed in production. |
| `SUPER_ADMIN_EMAIL` | Email used by the super admin seed script. |
| `SUPER_ADMIN_PASSWORD` | Temporary password used by the super admin seed script. Rotate after seeding. |

### Client

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL. Defaults to `http://localhost:5000/api` in local setup. |

## Testing

Run server tests:

```bash
cd server
npm test
```

Run client tests:

```bash
cd client
npm test
```

The server test suite uses `mongodb-memory-server`, so it does not need a real test database.

## CI/CD

GitHub Actions runs server tests plus client tests and build on every push or pull request to `main` and `master`. The workflow uses placeholder local test values only and does not require real provider secrets.

## Security

- `helmet` hardens common HTTP headers.
- CORS is restricted to `CLIENT_URL`.
- Express JSON and URL-encoded payloads are size-limited.
- Request input is sanitized before reaching route handlers.
- Authentication uses JWT bearer tokens.
- Passwords are hashed with bcryptjs.
- Sensitive organization routes require `x-org-id` tenant context.
- RBAC middleware checks roles and permissions before protected actions.
- Auth, invite, upload, search, global API, and super admin rate limiters reduce abuse risk.
- Production startup validates required environment variables.
- Swagger docs are hidden in production unless explicitly enabled.
- Real secrets belong in environment variables, never in source control.

## Theming

The client includes a light, dark, and system theme flow. Theme state is exposed through the theme context and reusable hooks, then applied consistently across layouts and shared UI components.

## Deployment

### Server on Render

1. Create a new Web Service from this repository.
2. Set the root directory to `server`.
3. Use `npm install` as the build command.
4. Use `npm start` as the start command.
5. Add production environment variables from `server/.env.example`.
6. Point `MONGO_URI` to MongoDB Atlas.
7. Keep `EXPOSE_DOCS_IN_PROD=false` unless public API docs are intentional.

### Client on Netlify

1. Create a new Netlify site from this repository.
2. Set the base directory to `client`.
3. Use `npm run build` as the build command.
4. Use `dist` as the publish directory.
5. Set `VITE_API_URL` to the deployed API URL, ending with `/api`.

### Cloudinary

1. Create a Cloudinary account.
2. Copy cloud name, API key, and API secret into the server environment.
3. Use signed server-side uploads only.

### MongoDB Atlas

1. Create a cluster and database user.
2. Allow the deployment provider IPs or configure network access appropriately.
3. Store the connection string in `MONGO_URI`.

## Use As A Template

- Rename the project and package names to match your product.
- Replace logos, colors, metadata, screenshots, and copy.
- Update organization plans in `server/utils/constants.js`.
- Add new resource models with an `orgId` field for tenant isolation.
- Protect organization-scoped routes with auth, tenant context, and permission middleware.
- Extend the role and permission maps in both server and client code when adding new capabilities.
- Keep API docs updated by adding OpenAPI annotations to new routes.

## Mock Billing Note

Billing is mock-only. It models plans, invoices, and billing history for dashboard and permission flows, but it does not process real payments. Integrate Stripe, Paddle, Lemon Squeezy, or another billing provider before accepting real money.

## Contributing

1. Create a feature branch.
2. Keep changes focused and reusable.
3. Run server and client tests before opening a pull request.
4. Document new environment variables, routes, and setup steps.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
