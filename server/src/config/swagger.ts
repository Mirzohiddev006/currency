// ════════════════════════════════════════════════════════════
// OPENAPI / SWAGGER SPEC — API documentation
// Served at GET /api/docs
// ════════════════════════════════════════════════════════════

import { env } from './env';

const servers = [
  { url: '/api', description: 'Current host' },
  { url: 'http://localhost:' + env.PORT + '/api', description: 'Local development' },
];

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Currency Tracker API',
    version: '1.0.0',
    description:
      'Uzbekistan bank currency-rate tracker. Public endpoints expose live CBU + bank rates; ' +
      'admin endpoints require a Bearer JWT obtained from POST /auth/login.',
  },
  servers,
  tags: [
    { name: 'Auth', description: 'Authentication' },
    { name: 'Rates', description: 'Public currency & bank rate data' },
    { name: 'Admin', description: 'Protected admin panel endpoints (Bearer JWT)' },
    { name: 'Bot', description: 'Telegram webhook' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Xatolik yuz berdi' },
        },
      },
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@currency.uz' },
          password: { type: 'string', example: 'Admin@12345' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJI...' },
              admin: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Admin login — returns a JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current admin profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/rates': {
      get: {
        tags: ['Rates'],
        summary: 'Latest rates (optionally filtered by currency)',
        parameters: [
          { name: 'currency', in: 'query', required: false, schema: { type: 'string', example: 'USD' }, description: '2-5 letter currency code' },
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/rates/overview': {
      get: {
        tags: ['Rates'],
        summary: 'Overview of all tracked currencies',
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/rates/{code}': {
      get: {
        tags: ['Rates'],
        summary: 'Rates for a single currency across banks',
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string', example: 'USD' } },
        ],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/rates/history/{bankCode}/{currency}': {
      get: {
        tags: ['Rates'],
        summary: 'Historical rates for a bank + currency',
        parameters: [
          { name: 'bankCode', in: 'path', required: true, schema: { type: 'string', example: 'kapitalbank' } },
          { name: 'currency', in: 'path', required: true, schema: { type: 'string', example: 'USD' } },
          { name: 'days', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 365, default: 30 } },
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/banks': {
      get: {
        tags: ['Rates'],
        summary: 'Bank board (all banks with their rates)',
        parameters: [
          { name: 'currency', in: 'query', required: false, schema: { type: 'string', example: 'USD' } },
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/banks/{bankCode}': {
      get: {
        tags: ['Rates'],
        summary: 'Detail for a single bank',
        parameters: [
          { name: 'bankCode', in: 'path', required: true, schema: { type: 'string', example: 'kapitalbank' } },
        ],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/admin/refresh': {
      post: {
        tags: ['Admin'],
        summary: 'Trigger a manual scrape of all rates',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/admin/banks/{bankCode}/refresh': {
      post: {
        tags: ['Admin'],
        summary: 'Trigger a manual scrape for a single bank',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'bankCode', in: 'path', required: true, schema: { type: 'string', example: 'kapitalbank' } },
        ],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Paginated list of Telegram users',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/admin/banks': {
      get: {
        tags: ['Admin'],
        summary: 'All banks (admin view)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/admin/banks/{id}/toggle': {
      patch: {
        tags: ['Admin'],
        summary: 'Enable/disable a bank',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Bank cuid' },
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/admin/logs': {
      get: {
        tags: ['Admin'],
        summary: 'Scrape logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 500, default: 50 } },
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'Usage analytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'days', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 90, default: 7 } },
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/admin/broadcast': {
      post: {
        tags: ['Admin'],
        summary: 'Broadcast a message to all active Telegram users',
        description: 'Sends text and/or an image to every active subscriber. At least one of text or imageUrl is required.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string', maxLength: 4000, example: 'Bugungi kurslar yangilandi!' },
                  imageUrl: { type: 'string', format: 'uri', example: 'https://example.com/banner.jpg' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Broadcast result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        sent: { type: 'integer' },
                        failed: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/bot/webhook': {
      post: {
        tags: ['Bot'],
        summary: 'Telegram webhook receiver',
        description: 'Receives Telegram updates. Returns 503 if the bot is not configured.',
        responses: {
          200: { description: 'Update handled' },
          503: { description: 'Bot disabled', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
  },
};
