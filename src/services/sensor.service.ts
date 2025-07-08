import { prisma } from '../config/database';
import { readingsQuerySchema } from '../schemas/sensor.schema';
import { AutomationService } from './automation.service';
import { z } from 'zod';

type ReadingsQueryInput = z.infer<typeof readingsQuerySchema>;

export class SensorService {
  private automationService: AutomationService;

  constructor() {
    this.automationService = new AutomationService();
  }

  async listReadings(params: ReadingsQueryInput) {
    const where: any = {};
    
    if (params.deploymentId) {
      where.deploymentId = params.deploymentId;
    }
    
    if (params.from || params.to) {
      where.timestamp = {};
      if (params.from) where.timestamp.gte = new Date(params.from);
      if (params.to) where.timestamp.lte = new Date(params.to);
    }

    return await prisma.sensorReading.findMany({
      where,
      select: {
        readingId: true,
        value: true,
        unit: true,
        timestamp: true,
        deployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0,
    });
  }

  async latestReadings() {
    // Récupérer les dernières lectures pour chaque déploiement de capteur
    const deployments = await prisma.componentDeployment.findMany({
      where: {
        componentType: {
          category: 'sensor',
        },
        active: true,
      },
      select: {
        deploymentId: true,
        lastValue: true,
        lastValueTs: true,
        componentType: {
          select: {
            name: true,
            identifier: true,
            category: true,
            unit: true,
          },
        },
        device: {
          select: {
            identifier: true,
            deviceType: true,
            model: true,
          },
        },
      },
    });

    return deployments.filter(deployment => deployment.lastValue !== null);
  }

  async aggregatedReadings() {
    // Agrégation des données par heure pour les dernières 24h
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const aggregatedData = await prisma.$queryRaw`
      SELECT 
        deployment_id,
        DATE_TRUNC('hour', timestamp) as hour,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as reading_count
      FROM sensor_readings 
      WHERE timestamp >= ${yesterday}
      GROUP BY deployment_id, DATE_TRUNC('hour', timestamp)
      ORDER BY hour DESC
    `;

    return aggregatedData;
  }

  async readingsForDeployment(deploymentId: number) {
    return await prisma.sensorReading.findMany({
      where: { deploymentId },
      select: {
        readingId: true,
        value: true,
        unit: true,
        timestamp: true,
        deployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async statsForDeployment(deploymentId: number) {
    const stats = await prisma.sensorReading.aggregate({
      where: { deploymentId },
      _count: { readingId: true },
      _avg: { value: true },
      _min: { value: true },
      _max: { value: true },
    });

    const latestReading = await prisma.sensorReading.findFirst({
      where: { deploymentId },
      orderBy: { timestamp: 'desc' },
      select: {
        value: true,
        timestamp: true,
      },
    });

    const deployment = await prisma.componentDeployment.findUnique({
      where: { deploymentId },
      select: {
        componentType: {
          select: {
            name: true,
            identifier: true,
            unit: true,
          },
        },
        device: {
          select: {
            identifier: true,
            deviceType: true,
          },
        },
        lastInteraction: true,
        connectionStatus: true,
      },
    });

    return {
      deployment,
      stats: {
        totalReadings: stats._count.readingId,
        averageValue: stats._avg.value,
        minValue: stats._min.value,
        maxValue: stats._max.value,
        latestReading,
      },
    };
  }

  /**
   * Adds a new sensor reading and triggers automation rules
   * This method is called by the MQTT handlers when new sensor data is received
   */
  async addSensorReading(
    deploymentId: number, 
    value: number, 
    unit: string, 
    timestamp: Date = new Date()
  ) {
    try {
      // Create the sensor reading
      const reading = await prisma.sensorReading.create({
        data: {
          deploymentId,
          value,
          unit,
          timestamp,
        },
      });

      // Update deployment last values
      await prisma.componentDeployment.update({
        where: { deploymentId },
        data: {
          lastValue: value,
          lastValueTs: timestamp,
          lastInteraction: new Date(),
          connectionStatus: 'online',
        },
      });

      console.log(`✅ Sensor reading added: deployment ${deploymentId} = ${value} ${unit}`);

      // Trigger automation rules for this sensor deployment
      await this.automationService.executeRules(deploymentId, value);

      return reading;
    } catch (error) {
      console.error(`❌ Error adding sensor reading:`, error);
      throw error;
    }
  }

  /**
   * Gets sensor readings that triggered alerts recently
   */
  async getAlertTriggeringReadings(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await prisma.sensorReading.findMany({
      where: {
        timestamp: {
          gte: since,
        },
        deployment: {
          automationRulesSensor: {
            some: {
              isActive: true,
              actionType: 'create_alert',
            },
          },
        },
      },
      include: {
        deployment: {
          include: {
            componentType: true,
            device: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Gets sensor readings that triggered actuator commands recently
   */
  async getActuatorTriggeringReadings(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await prisma.sensorReading.findMany({
      where: {
        timestamp: {
          gte: since,
        },
        deployment: {
          automationRulesSensor: {
            some: {
              isActive: true,
              actionType: 'trigger_actuator',
            },
          },
        },
      },
      include: {
        deployment: {
          include: {
            componentType: true,
            device: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Gets sensor deployments that haven't received data recently
   */
  async getInactiveSensors(timeoutMinutes: number = 10) {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    return await prisma.componentDeployment.findMany({
      where: {
        componentType: {
          category: 'sensor',
        },
        active: true,
        lastInteraction: {
          lt: timeoutDate,
        },
      },
      include: {
        componentType: true,
        device: true,
      },
      orderBy: { lastInteraction: 'desc' },
    });
  }
} 