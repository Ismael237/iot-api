import { prisma } from '../config/database';
import { publishMqttMessage } from '../mqtt/publisher';
import config from '../config';

export class ActuatorService {
  /**
   * Sends a command to an actuator.
   * @param deploymentId - The ID of the component deployment (actuator).
   * @param command - The command to send (e.g., "ON", "OFF", "SET_VALUE").
   * @param parameters - Optional parameters for the command.
   */
  async sendCommand(deploymentId: number, command: string, parameters?: object): Promise<void> {
    // Retrieve device and component type information for topic construction and validation
    const deployment = await prisma.componentDeployment.findUnique({
      where: { deployment_id: deploymentId },
      include: {
        device: true,
        componentType: true,
      },
    });

    if (!deployment || deployment.componentType.category !== 'actuator') {
      throw new Error('Actuator deployment not found or is not an actuator.');
    }

    const topic = `iot/${deployment.device.identifier}/actuator/${deployment.deployment_id}`;
    const message = JSON.stringify({
      command,
      parameters,
      timestamp: new Date().toISOString(),
    });

    // Publish the command via MQTT
    await publishMqttMessage(topic, message);

    // Log the command in the database
    await prisma.actuatorCommand.create({
      data: {
        deployment_id: deploymentId,
        command,
        parameters: parameters || {},
      },
    });
  }
} 