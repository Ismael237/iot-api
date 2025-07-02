import { FastifyInstance } from 'fastify';

export async function sensorsController(app: FastifyInstance) {
  app.get('/api/v1/sensors/readings', async (req, reply) => {
    // TODO: list readings
    reply.send([]);
  });
  app.get('/api/v1/sensors/readings/latest', async (req, reply) => {
    // TODO: latest readings
    reply.send([]);
  });
  app.get('/api/v1/sensors/readings/aggregated', async (req, reply) => {
    // TODO: aggregated data
    reply.send([]);
  });
  app.get('/api/v1/sensors/:deploymentId/readings', async (req, reply) => {
    // TODO: readings for a sensor
    reply.send([]);
  });
  app.get('/api/v1/sensors/:deploymentId/stats', async (req, reply) => {
    // TODO: stats for a sensor
    reply.send({});
  });
} 