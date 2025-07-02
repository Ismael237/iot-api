import { FastifyInstance } from 'fastify';

export async function zonesController(app: FastifyInstance) {
  app.get('/api/v1/zones', async (req, reply) => {
    // TODO: list zones
    reply.send([]);
  });
  app.post('/api/v1/zones', async (req, reply) => {
    // TODO: create zone
    reply.send({});
  });
  app.get('/api/v1/zones/:id', async (req, reply) => {
    // TODO: get zone by id
    reply.send({});
  });
  app.patch('/api/v1/zones/:id', async (req, reply) => {
    // TODO: update zone
    reply.send({});
  });
  app.delete('/api/v1/zones/:id', async (req, reply) => {
    // TODO: delete zone
    reply.send({});
  });
  app.post('/api/v1/zones/:id/components/:deploymentId', async (req, reply) => {
    // TODO: assign component to zone
    reply.send({});
  });
} 