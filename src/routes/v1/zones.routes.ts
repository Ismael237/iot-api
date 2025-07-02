import { FastifyInstance } from 'fastify';
import { zonesController } from '../../controllers/zones.controller';

export default async function (app: FastifyInstance) {
  await zonesController(app);
} 