import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SensorService } from '../services/sensor.service';
import { readingsQuerySchema } from '../schemas/sensor.schema';
import { ZodError } from 'zod';
import { stringifyBigInts } from '../utils/validation.util';

export async function sensorsController(app: FastifyInstance) {
  const sensorService = new SensorService();

  // List all sensor readings
  app.get('/api/v1/sensors/readings', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = readingsQuerySchema.parse(req.query);
      const readings = await sensorService.listReadings(query);
      reply.send(stringifyBigInts(readings));
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching sensor readings', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching sensor readings' });
      }
    }
  });

  // Get latest readings from all sensors
  app.get('/api/v1/sensors/readings/latest', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const latestReadings = await sensorService.latestReadings();
      reply.send(stringifyBigInts(latestReadings));
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching latest readings', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching latest readings' });
      }
    }
  });

  // Get aggregated sensor data
  app.get('/api/v1/sensors/readings/aggregated', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { interval, deploymentId, startDate, endDate } = req.query as any;
      const aggregatedData = await sensorService.aggregatedReadings();
      reply.send(stringifyBigInts(aggregatedData));
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching aggregated readings', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching aggregated readings' });
      }
    }
  });

  // Get readings for a specific sensor deployment
  app.get('/api/v1/sensors/:deploymentId/readings', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deploymentId = parseInt((req.params as any).deploymentId);
      
      if (isNaN(deploymentId)) {
        reply.code(400).send({ message: 'Invalid deployment ID' });
        return;
      }

      const readings = await sensorService.readingsForDeployment(deploymentId);
      const readingsWithBigInt = readings.map((reading) => {
        return {
          ...reading,
          readingId: reading.readingId.toString()
        }
      });
      reply.send(readingsWithBigInt);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching sensor readings', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching sensor readings' });
      }
    }
  });

  // Get statistics for a specific sensor deployment
  app.get('/api/v1/sensors/:deploymentId/stats', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deploymentId = parseInt((req.params as any).deploymentId);
      
      if (isNaN(deploymentId)) {
        reply.code(400).send({ message: 'Invalid deployment ID' });
        return;
      }

      const stats = await sensorService.statsForDeployment(deploymentId);
      if (!stats) {
        reply.code(404).send({ message: 'Sensor deployment not found' });
        return;
      }

      reply.send(stringifyBigInts(stats));
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching sensor statistics', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching sensor statistics' });
      }
    }
  });
} 