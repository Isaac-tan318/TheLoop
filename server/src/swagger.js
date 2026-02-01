import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TheLoop API',
      version: '1.0.0',
      description: 'API documentation for TheLoop - University Event Discovery Platform',
      contact: {
        name: 'TheLoop Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            name: { type: 'string', description: 'User display name' },
            role: { type: 'string', enum: ['student', 'organiser'], description: 'User role' },
            interests: { type: 'array', items: { type: 'string' }, description: 'User interests' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Event ID' },
            title: { type: 'string', description: 'Event title' },
            description: { type: 'string', description: 'Event description' },
            location: { type: 'string', description: 'Event location' },
            startDate: { type: 'string', format: 'date-time', description: 'Event start date' },
            endDate: { type: 'string', format: 'date-time', description: 'Event end date' },
            organiserId: { type: 'string', description: 'Organiser user ID' },
            organiserName: { type: 'string', description: 'Organiser display name' },
            interests: { type: 'array', items: { type: 'string' }, description: 'Event categories/interests' },
            capacity: { type: 'number', description: 'Maximum attendees' },
            signupCount: { type: 'number', description: 'Current signup count' },
            signupsOpen: { type: 'boolean', description: 'Whether signups are open' },
            imageUrl: { type: 'string', description: 'Event image URL' },
            additionalFields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string', enum: ['text', 'textarea', 'select'] },
                  required: { type: 'boolean' },
                  options: { type: 'string', description: 'Comma-separated options for select type' },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Signup: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Signup ID' },
            eventId: { type: 'string', description: 'Event ID' },
            userId: { type: 'string', description: 'User ID' },
            userName: { type: 'string', description: 'User display name' },
            userEmail: { type: 'string', description: 'User email' },
            additionalInfo: { type: 'object', description: 'Answers to additional fields' },
            reminder: {
              type: 'object',
              properties: {
                sent: { type: 'boolean' },
                dismissed: { type: 'boolean' },
                time: { type: 'string', format: 'date-time' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT access token' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Error message' },
            code: { type: 'string', description: 'Error code (optional)' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Events', description: 'Event management endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Signups', description: 'Event signup endpoints' },
      { name: 'Suggestions', description: 'AI-powered event recommendations' },
      { name: 'Analytics', description: 'User behavior tracking endpoints' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
