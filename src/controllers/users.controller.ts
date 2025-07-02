import { FastifyInstance } from 'fastify';

export async function usersController(app: FastifyInstance) {
  app.get('/api/v1/users', async (req, reply) => {
    // TODO: list users
    reply.send([]);
  });
  app.post('/api/v1/users', async (req, reply) => {
    // TODO: create user
    reply.send({});
  });
  app.get('/api/v1/users/:id', async (req, reply) => {
    // TODO: get user by id
    reply.send({});
  });
  app.patch('/api/v1/users/:id', async (req, reply) => {
    // TODO: update user
    reply.send({});
  });
} 