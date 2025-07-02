import { FastifyInstance } from 'fastify';
import { authController } from '../../controllers/auth.controller';

export default async function (app: FastifyInstance) {
  await authController(app);
} 