import { FastifyInstance } from 'fastify';
import { automationController } from '../../controllers/automation.controller.js';

export default async function (app: FastifyInstance) {
  await automationController(app);
} 