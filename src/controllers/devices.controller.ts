import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DeviceService } from '../services/device.service';
import { createDeviceSchema, updateDeviceSchema } from '../schemas/device.schema';
import { ZodError } from 'zod';

export async function devicesController(app: FastifyInstance) {
  const deviceService = new DeviceService();

  // List all devices
  app.get('/api/v1/devices', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const devices = await deviceService.listDevices();
      reply.send(devices);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching devices', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching devices' });
      }
    }
  });

  // Create new device
  app.post('/api/v1/devices', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deviceData = createDeviceSchema.parse(req.body);
      const device = await deviceService.createDevice(deviceData);
      reply.code(201).send(device);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error creating device', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while creating device' });
      }
    }
  });

  // Get device by ID
  app.get('/api/v1/devices/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deviceId = parseInt((req.params as any).id);
      
      if (isNaN(deviceId)) {
        reply.code(400).send({ message: 'Invalid device ID' });
        return;
      }

      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        reply.code(404).send({ message: 'Device not found' });
        return;
      }

      reply.send(device);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching device', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching device' });
      }
    }
  });

  // Update device
  app.patch('/api/v1/devices/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deviceId = parseInt((req.params as any).id);
      
      if (isNaN(deviceId)) {
        reply.code(400).send({ message: 'Invalid device ID' });
        return;
      }

      const deviceData = updateDeviceSchema.parse(req.body);
      const device = await deviceService.updateDevice(deviceId, deviceData);
      
      if (!device) {
        reply.code(404).send({ message: 'Device not found' });
        return;
      }

      reply.send(device);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error updating device', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while updating device' });
      }
    }
  });

  // Delete device
  app.delete('/api/v1/devices/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deviceId = parseInt((req.params as any).id);
      
      if (isNaN(deviceId)) {
        reply.code(400).send({ message: 'Invalid device ID' });
        return;
      }

      const success = await deviceService.deleteDevice(deviceId);
      if (!success) {
        reply.code(404).send({ message: 'Device not found' });
        return;
      }

      reply.send({ message: 'Device deleted successfully' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error deleting device', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while deleting device' });
      }
    }
  });
} 