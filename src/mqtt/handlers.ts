import client from './client';
import { prisma } from '../config/database';
import { SensorService } from '../services/sensor.service';

const sensorService = new SensorService();

/**
 * Registers MQTT message handlers to process incoming data from various topics.
 * Subscribes to sensor data, device status, and heartbeat topics.
 */
export function registerMqttHandlers() {
  // Subscribe to relevant topics with appropriate QoS levels.
  // QoS 0 for sensor data (high volume, loss acceptable)
  client.subscribe('iot/+/sensor/+', { qos: 0 });
  // QoS 1 for device status (important state)
  client.subscribe('iot/+/status', { qos: 1 });
  // QoS 1 for heartbeat (keep-alive)
  client.subscribe('iot/+/heartbeat', { qos: 1 });

  client.on('message', async (topic, message) => {
    console.log(`Received MQTT message - Topic: ${topic}, Message: ${message.toString()}`);
    try {
      const parts = topic.split('/');
      const deviceIdentifier = parts[1];
      const messageType = parts[2];
      const componentId = parts[3];

      const payload = JSON.parse(message.toString());

      // Handle sensor data
      if (messageType === 'sensor' && componentId) {
        const value = payload.value;
        const unit = payload.unit;
        const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

        // Find the deployment to link the reading
        const deployment = await prisma.componentDeployment.findFirst({
          where: {
            deployment_id: parseInt(componentId),
            device: {
              identifier: deviceIdentifier,
            },
            componentType: {
              category: 'sensor',
            },
          },
        });

        if (deployment) {
          await sensorService.addSensorReading(deployment.deployment_id, value, unit, timestamp);
          console.log(`Sensor reading processed for deployment ${deployment.deployment_id}: Value=${value} ${unit}`);
        } else {
          console.warn(`No matching sensor deployment found for device ${deviceIdentifier}, component ${componentId}`);
        }
      } else if (messageType === 'status') {
        // Handle device status updates (e.g., online/offline)
        const status = payload.status;
        const ipAddress = payload.ip;
        const firmware = payload.firmware;
        const uptime = payload.uptime;

        await prisma.iotDevice.updateMany({
          where: { identifier: deviceIdentifier },
          data: {
            last_seen: new Date(),
            ip_address: ipAddress || null,
            metadata: { ...payload }, // Store full status as metadata or specific fields
            // active: status === 'online', // Or handle active status based on specific rules
          },
        });
        console.log(`Device status updated for ${deviceIdentifier}: ${status}`);
      } else if (messageType === 'heartbeat') {
        // Handle device heartbeat
        await prisma.iotDevice.updateMany({
          where: { identifier: deviceIdentifier },
          data: {
            last_seen: new Date(),
            // Optionally update active status to true if a heartbeat is received
            // active: true,
          },
        });
        console.log(`Heartbeat received from ${deviceIdentifier}`);
      } else {
        console.warn(`Unhandled MQTT message type: ${messageType} for topic ${topic}`);
      }
    } catch (error) {
      console.error(`Error processing MQTT message for topic ${topic}:`, error);
    }
  });
} 