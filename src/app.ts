import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { registerRoutes } from './routes';
import { authenticate } from './middleware/auth.middleware';
import config from './config';

export function buildApp() {
  const app = Fastify({ logger: { level: config.logging.level } });

  // Register plugins
  app.register(cors, { origin: config.cors.origin || true });
  app.register(jwt, { secret: config.jwt.secret });
  app.register(cookie); // Register the cookie plugin

  // Decorate Fastify instance with authentication function
  app.decorate('authenticate', authenticate);

  // Register routes
  app.register(registerRoutes);

  // Set up error handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof Error) {
      app.log.error(error); // Log the error for debugging
      reply.status(500).send({ message: 'Internal Server Error', error: error.message });
    } else {
      reply.status(500).send({ message: 'Internal Server Error' });
    }
  });

  return app;
} 