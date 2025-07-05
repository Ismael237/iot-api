import { FastifyInstance } from 'fastify';
import { devicesController } from '../../controllers/devices.controller.js';

export default async function (app: FastifyInstance) {
  await devicesController(app);
} 