import { FastifyInstance } from 'fastify';

export async function componentsController(app: FastifyInstance) {
  // Types de composants
  app.get('/api/v1/components/types', async (req, reply) => {
    // TODO: list component types
    reply.send([]);
  });
  app.post('/api/v1/components/types', async (req, reply) => {
    // TODO: create component type
    reply.send({});
  });

  // Déploiements de composants
  app.get('/api/v1/components/deployments', async (req, reply) => {
    // TODO: list deployments
    reply.send([]);
  });
  app.post('/api/v1/components/deployments', async (req, reply) => {
    // TODO: create deployment
    reply.send({});
  });
  app.patch('/api/v1/components/deployments/:id', async (req, reply) => {
    // TODO: update deployment
    reply.send({});
  });
  app.delete('/api/v1/components/deployments/:id', async (req, reply) => {
    // TODO: delete deployment
    reply.send({});
  });
} 