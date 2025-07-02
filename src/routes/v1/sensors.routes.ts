import { FastifyInstance } from 'fastify';
import { sensorsController } from '../../controllers/sensors.controller';

export default async function (app: FastifyInstance) {
  await sensorsController(app);
} 