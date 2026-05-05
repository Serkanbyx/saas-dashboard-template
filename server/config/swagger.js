import swaggerJsdoc from 'swagger-jsdoc';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SaaS Dashboard Template API',
      version,
      description: 'Multi-tenant SaaS API with RBAC, invitations, billing, and real-time notifications.',
      contact: {
        name: 'Serkanby',
        url: 'https://serkanbayraktar.com/',
      },
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        orgIdHeader: { type: 'apiKey', in: 'header', name: 'x-org-id' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Demo User' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            avatar: { type: 'string', example: 'https://example.com/avatar.png' },
            platformRole: { type: 'string', enum: ['user', 'superadmin'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            name: { type: 'string', example: 'Demo Org' },
            slug: { type: 'string', example: 'demo-org' },
            logo: { type: 'string', example: 'https://example.com/logo.png' },
            description: { type: 'string', example: 'Demo organization description' },
            plan: { type: 'string', enum: ['free', 'pro'], example: 'free' },
            seatsUsed: { type: 'integer', example: 1 },
            seatLimit: { type: 'integer', example: 5 },
            ownerId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Membership: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
            userId: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }] },
            orgId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            role: { type: 'string', enum: ['owner', 'admin', 'member'], example: 'member' },
            joinedAt: { type: 'string', format: 'date-time' },
          },
        },
        Invitation: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
            email: { type: 'string', format: 'email', example: 'invitee@example.com' },
            orgId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            role: { type: 'string', enum: ['admin', 'member'], example: 'member' },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'expired', 'revoked'],
              example: 'pending',
            },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        BillingRecord: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439015' },
            orgId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            type: {
              type: 'string',
              enum: ['subscription', 'upgrade', 'downgrade', 'invoice'],
              example: 'subscription',
            },
            previousPlan: { type: 'string', enum: ['free', 'pro'], example: 'free' },
            newPlan: { type: 'string', enum: ['free', 'pro'], example: 'pro' },
            amount: { type: 'number', example: 29 },
            currency: { type: 'string', example: 'USD' },
            status: { type: 'string', enum: ['paid', 'pending', 'failed'], example: 'paid' },
            invoiceNumber: { type: 'string', example: 'INV-000001' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439016' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            orgId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            type: { type: 'string', example: 'invite_received' },
            title: { type: 'string', example: 'Demo notification' },
            message: { type: 'string', example: 'Demo notification message' },
            link: { type: 'string', example: '/dashboard' },
            read: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ActivityLog: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439017' },
            orgId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            actorId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            action: { type: 'string', example: 'org.created' },
            targetType: { type: 'string', example: 'organization' },
            targetId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            metadata: { type: 'object', additionalProperties: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Request failed' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js'],
};

export default swaggerJsdoc(options);
