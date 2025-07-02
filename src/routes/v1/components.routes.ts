import { FastifyInstance } from 'fastify';
import { componentsController } from '../../controllers/components.controller';

export default async function (app: FastifyInstance) {
  await componentsController(app);
} 