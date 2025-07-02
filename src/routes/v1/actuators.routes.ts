import { FastifyInstance } from 'fastify';
import { actuatorsController } from '../../controllers/actuators.controller';

export default async function (app: FastifyInstance) {
  await actuatorsController(app);
} 