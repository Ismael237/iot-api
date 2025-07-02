import { FastifyInstance } from 'fastify';
import { usersController } from '../../controllers/users.controller';

export default async function (app: FastifyInstance) {
  await usersController(app);
} 