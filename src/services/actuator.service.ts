import { prisma } from '../config/database';
import { publishActuatorCommand, publishServoCommand } from '../mqtt/publisher';

export class ActuatorService {
  /**
   * Sends a command to an actuator and logs it in the database
   */
  async sendActuatorCommand(
    deploymentId: number,
    command: string,
    parameters?: Record<string, any>,
    issuedBy?: number
  ) {
    try {
      // Get deployment details
      const deployment = await prisma.componentDeployment.findUnique({
        where: { deploymentId },
        include: {
          device: true,
          componentType: true,
        },
      });

      if (!deployment) {
        throw new Error(`Deployment ${deploymentId} not found`);
      }

      if (deployment.componentType.category !== 'actuator') {
        throw new Error(`Deployment ${deploymentId} is not an actuator`);
      }

      // Map component type to MQTT component ID
      const componentId = this.getMqttComponentId(deployment.componentType.identifier);
      
      // Send command via MQTT
      if (componentId === 'servo') {
        const angle = parseInt(command);
        if (isNaN(angle) || angle < 0 || angle > 180) {
          throw new Error('Servo angle must be between 0 and 180 degrees');
        }
        publishServoCommand(deployment.device.identifier, angle);
      } else {
        publishActuatorCommand(deployment.device.identifier, componentId, command);
      }

      // Log command in database
      await prisma.actuatorCommand.create({
        data: {
          deploymentId,
          command,
          parameters: parameters || {},
          issuedBy,
        },
      });

      // Update deployment last interaction
      await prisma.componentDeployment.update({
        where: { deploymentId },
        data: {
          lastInteraction: new Date(),
          connectionStatus: 'online',
        },
      });

      console.log(`✅ Actuator command sent: ${deployment.device.identifier}/${componentId} = ${command}`);
      
      return {
        success: true,
        deploymentId,
        command,
        deviceId: deployment.device.identifier,
        componentId,
      };
    } catch (error) {
      console.error(`❌ Error sending actuator command:`, error);
      throw error;
    }
  }

  /**
   * Gets the latest commands for a deployment
   */
  async getLatestCommands(deploymentId: number, limit: number = 10) {
    return await prisma.actuatorCommand.findMany({
      where: { deploymentId },
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
      take: Number(limit),
    });
  }

  /**
   * Gets actuator deployments with their latest commands
   */
  async getActuatorDeployments() {
    return await prisma.componentDeployment.findMany({
      where: {
        componentType: {
          category: 'actuator',
        },
        active: true,
      },
      include: {
        componentType: true,
        device: true,
        actuatorCommands: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Maps database component identifiers to MQTT component IDs
   */
  private getMqttComponentId(componentIdentifier: string): string {
    const mapping: Record<string, string> = {
      'lighting_system': 'light',
      'ventilation_fan': 'fan1', // Note: Both fans map to fan1, you might want to differentiate
      'water_pump': 'pump',
      'automatic_feeder': 'feeder',
      'gate_servo': 'servo',
    };

    return mapping[componentIdentifier] || componentIdentifier;
  }
} 