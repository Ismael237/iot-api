import { FastifyInstance } from 'fastify';
import authRoutes from './v1/auth.routes';
import usersRoutes from './v1/users.routes';
import devicesRoutes from './v1/devices.routes';
import componentsRoutes from './v1/components.routes';
import sensorsRoutes from './v1/sensors.routes';
import actuatorsRoutes from './v1/actuators.routes';
import zonesRoutes from './v1/zones.routes';
import automationRoutes from './v1/automation.routes';

export async function registerRoutes(app: FastifyInstance) {
  await authRoutes(app);
  await usersRoutes(app);
  await devicesRoutes(app);
  await componentsRoutes(app);
  await sensorsRoutes(app);
  await actuatorsRoutes(app);
  await zonesRoutes(app);
  await automationRoutes(app);
  // TODO: register other routes
} 