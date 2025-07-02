import { FastifyInstance } from 'fastify';

export async function actuatorsController(app: FastifyInstance) {
  app.post('/api/v1/actuators/:deploymentId/command', async (req, reply) => {
    // TODO: send command
    reply.send({});
  });
  app.get('/api/v1/actuators/:deploymentId/commands', async (req, reply) => {
    // TODO: list commands
    reply.send([]);
  });
  app.get('/api/v1/actuators/:deploymentId/status', async (req, reply) => {
    // TODO: actuator status
    reply.send({});
  });
} 