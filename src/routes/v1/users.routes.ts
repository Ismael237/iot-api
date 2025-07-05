import { FastifyInstance } from 'fastify';
import { usersController } from '../../controllers/users.controller.js';

export default async function (app: FastifyInstance) {
  await usersController(app);
} 