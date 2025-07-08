import { FastifyInstance } from 'fastify';
import { actuatorRoutes } from '../../controllers/actuators.controller';

export default async function (app: FastifyInstance) {
  await actuatorRoutes(app);
} 