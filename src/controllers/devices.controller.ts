import { FastifyInstance } from 'fastify';

export async function devicesController(app: FastifyInstance) {
  app.get('/api/v1/devices', async (req, reply) => {
    // TODO: list devices
    reply.send([]);
  });
  app.post('/api/v1/devices', async (req, reply) => {
    // TODO: create device
    reply.send({});
  });
  app.get('/api/v1/devices/:id', async (req, reply) => {
    // TODO: get device by id
    reply.send({});
  });
  app.patch('/api/v1/devices/:id', async (req, reply) => {
    // TODO: update device
    reply.send({});
  });
  app.delete('/api/v1/devices/:id', async (req, reply) => {
    // TODO: delete device
    reply.send({});
  });
} 