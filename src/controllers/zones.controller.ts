import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZoneService } from '../services/zone.service';
import { createZoneSchema, updateZoneSchema } from '../schemas/zone.schema';
import { ZodError } from 'zod';

export async function zonesController(app: FastifyInstance) {
  const zoneService = new ZoneService();

  // List all zones
  app.get('/api/v1/zones', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const zones = await zoneService.listZones();
      reply.send(zones);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching zones', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching zones' });
      }
    }
  });

  // Create new zone
  app.post('/api/v1/zones', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const zoneData = createZoneSchema.parse(req.body);
      const zone = await zoneService.createZone(zoneData);
      reply.code(201).send(zone);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error creating zone', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while creating zone' });
      }
    }
  });

  // Get zone by ID
  app.get('/api/v1/zones/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const zoneId = parseInt((req.params as any).id);
      
      if (isNaN(zoneId)) {
        reply.code(400).send({ message: 'Invalid zone ID' });
        return;
      }

      const zone = await zoneService.getZone(zoneId);
      if (!zone) {
        reply.code(404).send({ message: 'Zone not found' });
        return;
      }

      reply.send(zone);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching zone', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching zone' });
      }
    }
  });

  // Update zone
  app.patch('/api/v1/zones/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const zoneId = parseInt((req.params as any).id);
      
      if (isNaN(zoneId)) {
        reply.code(400).send({ message: 'Invalid zone ID' });
        return;
      }

      const zoneData = updateZoneSchema.parse(req.body);
      const zone = await zoneService.updateZone(zoneId, zoneData);
      
      if (!zone) {
        reply.code(404).send({ message: 'Zone not found' });
        return;
      }

      reply.send(zone);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error updating zone', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while updating zone' });
      }
    }
  });

  // Delete zone
  app.delete('/api/v1/zones/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const zoneId = parseInt((req.params as any).id);
      
      if (isNaN(zoneId)) {
        reply.code(400).send({ message: 'Invalid zone ID' });
        return;
      }

      const success = await zoneService.deleteZone(zoneId);
      if (!success) {
        reply.code(404).send({ message: 'Zone not found' });
        return;
      }

      reply.send({ message: 'Zone deleted successfully' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error deleting zone', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while deleting zone' });
      }
    }
  });

  // Assign component to zone
  app.post('/api/v1/zones/:id/components/:deploymentId', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const zoneId = parseInt((req.params as any).id);
      const deploymentId = parseInt((req.params as any).deploymentId);
      
      if (isNaN(zoneId) || isNaN(deploymentId)) {
        reply.code(400).send({ message: 'Invalid zone ID or deployment ID' });
        return;
      }

      const result = await zoneService.assignComponent(zoneId, deploymentId, {});
      if (!result) {
        reply.code(404).send({ message: 'Zone or component deployment not found' });
        return;
      }

      reply.send({ message: 'Component assigned to zone successfully' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error assigning component to zone', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while assigning component to zone' });
      }
    }
  });
} 