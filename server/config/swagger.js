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
      schemas: {
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
