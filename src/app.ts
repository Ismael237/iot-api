import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { registerRoutes } from './routes';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: process.env.CORS_ORIGIN || true });
  app.register(jwt, { secret: process.env.JWT_SECRET || 'changeme' });

  // TODO: Register routes here
  app.register(registerRoutes);

  return app;
} 