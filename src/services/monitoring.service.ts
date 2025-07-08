import { prisma } from '../config/database';
import { publishDeviceStatus, publishHeartbeat } from '../mqtt/publisher';
import { DeviceService } from './device.service';
import { ComponentService } from './component.service';
import { SensorService } from './sensor.service';

export class MonitoringService {
  private deviceService: DeviceService;
  private componentService: ComponentService;
  private sensorService: SensorService;

  constructor() {
    this.deviceService = new DeviceService();
    this.componentService = new ComponentService();
    this.sensorService = new SensorService();
  }

  /**
   * Gets overall system health status
   */
  async getSystemHealth() {
    try {
      const [
        totalDevices,
        onlineDevices,
        offlineDevices,
        totalSensors,
        activeSensors,
        inactiveSensors,
        totalActuators,
        activeActuators,
        inactiveActuators,
      ] = await Promise.all([
        prisma.ioTDevice.count({ where: { active: true } }),
        prisma.ioTDevice.count({ 
          where: { 
            active: true,
            lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes
          }
        }),
        prisma.ioTDevice.count({ 
          where: { 
            active: true,
            lastSeen: { lt: new Date(Date.now() - 5 * 60 * 1000) }
          }
        }),
        prisma.componentDeployment.count({ 
          where: { 
            componentType: { category: 'sensor' },
            active: true
          }
        }),
        prisma.componentDeployment.count({ 
          where: { 
            componentType: { category: 'sensor' },
            active: true,
            lastInteraction: { gte: new Date(Date.now() - 10 * 60 * 1000) }
          }
        }),
        prisma.componentDeployment.count({ 
          where: { 
            componentType: { category: 'sensor' },
            active: true,
            lastInteraction: { lt: new Date(Date.now() - 10 * 60 * 1000) }
          }
        }),
        prisma.componentDeployment.count({ 
          where: { 
            componentType: { category: 'actuator' },
            active: true
          }
        }),
        prisma.componentDeployment.count({ 
          where: { 
            componentType: { category: 'actuator' },
            active: true,
            lastInteraction: { gte: new Date(Date.now() - 30 * 60 * 1000) }
          }
        }),
        prisma.componentDeployment.count({ 
          where: { 
            componentType: { category: 'actuator' },
            active: true,
            lastInteraction: { lt: new Date(Date.now() - 30 * 60 * 1000) }
          }
        }),
      ]);

      const healthScore = this.calculateHealthScore({
        onlineDevices,
        totalDevices,
        activeSensors,
        totalSensors,
        activeActuators,
        totalActuators,
      });

      return {
        status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
        score: healthScore,
        devices: {
          total: totalDevices,
          online: onlineDevices,
          offline: offlineDevices,
          onlinePercentage: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0,
        },
        sensors: {
          total: totalSensors,
          active: activeSensors,
          inactive: inactiveSensors,
          activePercentage: totalSensors > 0 ? Math.round((activeSensors / totalSensors) * 100) : 0,
        },
        actuators: {
          total: totalActuators,
          active: activeActuators,
          inactive: inactiveActuators,
          activePercentage: totalActuators > 0 ? Math.round((activeActuators / totalActuators) * 100) : 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error getting system health:', error);
      throw error;
    }
  }

  /**
   * Calculates overall system health score
   */
  private calculateHealthScore(metrics: {
    onlineDevices: number;
    totalDevices: number;
    activeSensors: number;
    totalSensors: number;
    activeActuators: number;
    totalActuators: number;
  }): number {
    const deviceScore = metrics.totalDevices > 0 ? (metrics.onlineDevices / metrics.totalDevices) * 100 : 100;
    const sensorScore = metrics.totalSensors > 0 ? (metrics.activeSensors / metrics.totalSensors) * 100 : 100;
    const actuatorScore = metrics.totalActuators > 0 ? (metrics.activeActuators / metrics.totalActuators) * 100 : 100;

    // Weighted average: devices 40%, sensors 40%, actuators 20%
    return Math.round((deviceScore * 0.4) + (sensorScore * 0.4) + (actuatorScore * 0.2));
  }

  /**
   * Sends heartbeat to all online devices
   */
  async sendHeartbeatToAllDevices() {
    try {
      const onlineDevices = await prisma.ioTDevice.findMany({
        where: {
          active: true,
          lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) }
        },
        select: { deviceId: true, identifier: true }
      });

      console.log(`💓 Sending heartbeat to ${onlineDevices.length} devices`);

      for (const device of onlineDevices) {
        try {
          publishHeartbeat(device.identifier);
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between messages
        } catch (error) {
          console.error(`❌ Error sending heartbeat to ${device.identifier}:`, error);
        }
      }

      return {
        success: true,
        devicesContacted: onlineDevices.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error sending heartbeat to all devices:', error);
      throw error;
    }
  }

  /**
   * Gets devices that need attention
   */
  async getDevicesNeedingAttention() {
    try {
      const [offlineDevices, inactiveSensors, inactiveActuators] = await Promise.all([
        this.deviceService.getOfflineDevices(5), // 5 minutes
        this.sensorService.getInactiveSensors(10), // 10 minutes
        this.componentService.getInactiveDeployments(30), // 30 minutes for actuators
      ]);

      const inactiveActuatorDeployments = inactiveActuators.filter(
        deployment => deployment.componentType.category === 'actuator'
      );

      return {
        offlineDevices,
        inactiveSensors,
        inactiveActuators: inactiveActuatorDeployments,
        totalIssues: offlineDevices.length + inactiveSensors.length + inactiveActuatorDeployments.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error getting devices needing attention:', error);
      throw error;
    }
  }

  /**
   * Publishes system status to all devices
   */
  async publishSystemStatus() {
    try {
      const health = await this.getSystemHealth();
      const devicesNeedingAttention = await this.getDevicesNeedingAttention();

      const systemStatus = {
        status: 'system_status',
        health: health.status,
        healthScore: health.score,
        devices: health.devices,
        sensors: health.sensors,
        actuators: health.actuators,
        issues: devicesNeedingAttention.totalIssues,
        timestamp: new Date().toISOString(),
      };

      // Get all active devices
      const activeDevices = await prisma.ioTDevice.findMany({
        where: { active: true },
        select: { identifier: true }
      });

      console.log(`📊 Publishing system status to ${activeDevices.length} devices`);

      for (const device of activeDevices) {
        try {
          publishDeviceStatus(device.identifier, systemStatus);
          await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
        } catch (error) {
          console.error(`❌ Error publishing system status to ${device.identifier}:`, error);
        }
      }

      return {
        success: true,
        devicesNotified: activeDevices.length,
        systemStatus,
      };
    } catch (error) {
      console.error('❌ Error publishing system status:', error);
      throw error;
    }
  }

  /**
   * Gets recent automation activities
   */
  async getRecentAutomationActivity(hours: number = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const [alertTriggeringReadings, actuatorTriggeringReadings, actuatorCommands] = await Promise.all([
        this.sensorService.getAlertTriggeringReadings(hours),
        this.sensorService.getActuatorTriggeringReadings(hours),
        prisma.actuatorCommand.findMany({
          where: {
            timestamp: { gte: since }
          },
          include: {
            deployment: {
              include: {
                componentType: true,
                device: true,
              },
            },
            issuer: {
              select: {
                userId: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 50,
        }),
      ]);

      return {
        alertTriggeringReadings,
        actuatorTriggeringReadings,
        actuatorCommands,
        totalActivities: alertTriggeringReadings.length + actuatorTriggeringReadings.length + actuatorCommands.length,
        period: `${hours} hours`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error getting recent automation activity:', error);
      throw error;
    }
  }

  /**
   * Gets system performance metrics
   */
  async getPerformanceMetrics() {
    try {
      const now = new Date();
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        sensorReadingsLastHour,
        sensorReadingsLast24Hours,
        actuatorCommandsLastHour,
        actuatorCommandsLast24Hours,
        alertsLast24Hours,
      ] = await Promise.all([
        prisma.sensorReading.count({ where: { timestamp: { gte: lastHour } } }),
        prisma.sensorReading.count({ where: { timestamp: { gte: last24Hours } } }),
        prisma.actuatorCommand.count({ where: { timestamp: { gte: lastHour } } }),
        prisma.actuatorCommand.count({ where: { timestamp: { gte: last24Hours } } }),
        prisma.alert.count({ where: { createdAt: { gte: last24Hours } } }),
      ]);

      return {
        lastHour: {
          sensorReadings: sensorReadingsLastHour,
          actuatorCommands: actuatorCommandsLastHour,
          averageSensorReadingsPerMinute: Math.round(sensorReadingsLastHour / 60),
        },
        last24Hours: {
          sensorReadings: sensorReadingsLast24Hours,
          actuatorCommands: actuatorCommandsLast24Hours,
          alerts: alertsLast24Hours,
          averageSensorReadingsPerHour: Math.round(sensorReadingsLast24Hours / 24),
        },
        timestamp: now.toISOString(),
      };
    } catch (error) {
      console.error('❌ Error getting performance metrics:', error);
      throw error;
    }
  }
} 