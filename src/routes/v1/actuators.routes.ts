import { FastifyInstance } from 'fastify';
import { actuatorsController } from '../../controllers/actuators.controller.js';

export default async function (app: FastifyInstance) {
  await actuatorsController(app);
} 