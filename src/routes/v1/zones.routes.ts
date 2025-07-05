import { FastifyInstance } from 'fastify';
import { zonesController } from '../../controllers/zones.controller.js';

export default async function (app: FastifyInstance) {
  await zonesController(app);
} 