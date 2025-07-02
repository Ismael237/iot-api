import { FastifyInstance } from 'fastify';

export async function authController(app: FastifyInstance) {
  app.post('/api/v1/auth/login', async (req, reply) => {
    // TODO: login logic
    reply.send({ message: 'login' });
  });
  app.post('/api/v1/auth/refresh', async (req, reply) => {
    // TODO: refresh logic
    reply.send({ message: 'refresh' });
  });
  app.post('/api/v1/auth/logout', async (req, reply) => {
    // TODO: logout logic
    reply.send({ message: 'logout' });
  });
  app.get('/api/v1/auth/me', async (req, reply) => {
    // TODO: get current user
    reply.send({ message: 'me' });
  });
} 