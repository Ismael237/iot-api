import client from './client';
import { prisma } from '../config/database';
import { SensorService } from '../services/sensor.service';

const sensorService = new SensorService();

// Queue for async message processing
const messageQueue: Array<{ topic: string; message: Buffer; timestamp: Date }> = [];
let isProcessing = false;

// Configuration for offline detection
const OFFLINE_THRESHOLD_MINUTES = 1; // Composant considéré offline après 5 minutes sans données
const MONITORING_INTERVAL_MS = 60000; // Vérification toutes les minutes

/**
 * Processes messages from the queue asynchronously
 */
async function processMessageQueue() {
  if (isProcessing || messageQueue.length === 0) return;

  isProcessing = true;

  while (messageQueue.length > 0) {
    const { topic, message, timestamp } = messageQueue.shift()!;

    try {
      await processMessage(topic, message, timestamp);
    } catch (error) {
      console.error(`❌ Error processing queued message from ${topic}:`, error);
    }
  }
  isProcessing = false;
}

/**
 * Processes a single MQTT message
 */
async function processMessage(topic: string, message: Buffer, timestamp: Date) {
  const parts = topic.split('/');
  const namespace = parts[0]; // 'farm'
  const deviceIdentifier = parts[1]; // 'esp32-farm-001'
  const messageType = parts[2]; // 'sensor' or 'actuator'
  const componentId = parts[3]; // component identifier

  if (namespace !== 'farm') {
    console.warn(`⚠️ Ignoring message from unknown namespace: ${namespace}`);
    return;
  }

  // Validate JSON payload
  let payload: any;
  try {
    payload = JSON.parse(message.toString());
  } catch (error) {
    console.error(`❌ Invalid JSON payload for topic ${topic}:`, error);
    return;
  }

  // Handle sensor data
  if (messageType === 'sensor' && componentId) {
    await processSensorData(deviceIdentifier, componentId, payload, timestamp);
  } else if (messageType === 'actuator' && componentId) {
    await processActuatorData(deviceIdentifier, componentId, message, timestamp);
  } else if (messageType === 'status') {
    await processDeviceStatus(deviceIdentifier, payload);
  } else if (messageType === 'heartbeat') {
    await processHeartbeat(deviceIdentifier, payload);
  } else {
    console.warn(`⚠️ Unhandled MQTT message type: ${messageType} for topic ${topic}`);
  }
}

/**
 * Processes sensor data messages
 */
async function processSensorData(deviceIdentifier: string, componentId: string, payload: any, timestamp: Date) {
  // Validate required fields
  if (typeof payload.value !== 'number' || !payload.unit) {
    console.error(`❌ Invalid sensor data format for ${componentId}:`, payload);
    return;
  }

  const value = payload.value;
  const unit = payload.unit;
  const sensorTimestamp = payload.timestamp ? new Date(payload.timestamp * 1000) : timestamp;

  try {
    // Find the deployment by device identifier and component mapping
    const deployment = await prisma.componentDeployment.findFirst({
      where: {
        device: {
          identifier: deviceIdentifier,
        },
        componentType: {
          identifier: getComponentIdentifier(componentId),
          category: 'sensor',
        },
      },
    });

    if (deployment) {
      // Update the ComponentDeployment with latest sensor data
      await prisma.componentDeployment.update({
        where: { deploymentId: deployment.deploymentId },
        data: {
          lastInteraction: sensorTimestamp,
          connectionStatus: 'online',
          lastValue: value,
          lastValueTs: sensorTimestamp,
        },
      });

      // Use the sensor service to add reading and trigger automation
      await sensorService.addSensorReading(deployment.deploymentId, value, unit, sensorTimestamp);
      console.log(`✅ Sensor reading processed: ${componentId} = ${value} ${unit}`);
    } else {
      console.warn(`⚠️ No matching sensor deployment found for device ${deviceIdentifier}, component ${componentId}`);
    }
  } catch (error) {
    console.error(`❌ Error processing sensor data for ${componentId}:`, error);
  }
}

/**
 * Processes actuator data messages
 */
async function processActuatorData(deviceIdentifier: string, componentId: string, message: Buffer, timestamp: Date) {
  // Try to parse as JSON, fallback to string/number
  let command: string = message.toString();
  let parameters: any = null;
  let parsedValue: number | null = null;

  try {
    try {
      const json = JSON.parse(command);
      command = json.command !== undefined ? String(json.command) : command;
      parameters = json;
      // Si le JSON contient une valeur numérique, on la prend pour lastValue
      if (typeof json.value === 'number') {
        parsedValue = json.value;
      } else if (!isNaN(Number(command))) {
        parsedValue = Number(command);
      }
    } catch {
      // Not JSON, keep as string
      if (!isNaN(Number(command))) {
        parsedValue = Number(command);
      } else if (command.toLowerCase() === 'on') {
        parsedValue = 1;
      } else if (command.toLowerCase() === 'off') {
        parsedValue = 0;
      }
    }

    // Find the deployment by device identifier and component mapping
    const deployment = await prisma.componentDeployment.findFirst({
      where: {
        device: {
          identifier: deviceIdentifier,
        },
        componentType: {
          identifier: getComponentIdentifier(componentId),
          category: 'actuator',
        },
      },
    });

    if (deployment) {
      // Update the ComponentDeployment with latest actuator state
      await prisma.componentDeployment.update({
        where: { deploymentId: deployment.deploymentId },
        data: {
          lastInteraction: timestamp,
          connectionStatus: 'online',
          lastValue: parsedValue,
          lastValueTs: timestamp,
        },
      });

      // Record the actuator command
      await prisma.actuatorCommand.create({
        data: {
          deploymentId: deployment.deploymentId,
          command: command,
          parameters: parameters,
          issuedBy: null,
          timestamp: timestamp,
        },
      });
      console.log(`✅ Actuator command processed: ${componentId} = ${command}`);
    } else {
      console.warn(`⚠️ No matching actuator deployment found for device ${deviceIdentifier}, component ${componentId}`);
    }
  } catch (error) {
    console.error(`❌ Error processing actuator data for ${componentId}:`, error);
  }
}

/**
 * Processes device status messages
 */
async function processDeviceStatus(deviceIdentifier: string, payload: any) {
  try {
    const status = payload.status;
    const ipAddress = payload.ip;
    const firmware = payload.firmware;
    const uptime = payload.uptime;

    await prisma.ioTDevice.updateMany({
      where: { identifier: deviceIdentifier },
      data: {
        lastSeen: new Date(),
        ipAddress: ipAddress || null,
        metadata: { ...payload },
      },
    });
    console.log(`✅ Device status updated for ${deviceIdentifier}: ${status}`);
  } catch (error) {
    console.error(`❌ Error processing device status for ${deviceIdentifier}:`, error);
  }
}

/**
 * Processes heartbeat messages
 */
async function processHeartbeat(deviceIdentifier: string, payload: any) {
  try {
    await prisma.ioTDevice.updateMany({
      where: { identifier: deviceIdentifier },
      data: {
        lastSeen: new Date(),
      },
    });
    console.log(`💓 Heartbeat received from ${deviceIdentifier}`);
  } catch (error) {
    console.error(`❌ Error processing heartbeat for ${deviceIdentifier}:`, error);
  }
}

/**
 * Registers MQTT message handlers to process incoming data from various topics.
 * Subscribes to sensor data, device status, and heartbeat topics.
 * Topics format: farm/esp32-farm-001/sensor/{component} or farm/esp32-farm-001/actuator/{component}
 */
export function registerMqttHandlers() {
  // Subscribe to relevant topics with appropriate QoS levels.
  // QoS 0 for sensor data (high volume, loss acceptable)
  client.subscribe('farm/+/sensor/+', { qos: 0 });
  // QoS 1 for actuator data (high volume, loss acceptable)
  client.subscribe('farm/+/actuator/+', { qos: 1 });
  // QoS 1 for device status (important state)
  client.subscribe('farm/+/status', { qos: 1 });
  // QoS 1 for heartbeat (keep-alive)
  client.subscribe('farm/+/heartbeat', { qos: 1 });

  client.on('message', async (topic, message) => {
    console.log(`📨 MQTT message received: ${topic} (${message.length} bytes)`);

    // Add message to processing queue
    messageQueue.push({
      topic,
      message,
      timestamp: new Date()
    });

    // Process queue asynchronously
    setImmediate(processMessageQueue);
  });

  // Start component monitoring for offline detection
  startComponentMonitoring();
}

/**
 * Checks for components that haven't received data recently and marks them as offline
 */
async function checkOfflineComponents() {
  try {
    const offlineThreshold = new Date(Date.now() - OFFLINE_THRESHOLD_MINUTES * 60 * 1000);
    
    // Find components that haven't had interaction recently and are currently online
    const offlineComponents = await prisma.componentDeployment.findMany({
      where: {
        active: true,
        connectionStatus: 'online',
        lastInteraction: {
          lt: offlineThreshold
        }
      },
      include: {
        componentType: true,
        device: true
      }
    });

    if (offlineComponents.length > 0) {
      console.log(`🔍 Found ${offlineComponents.length} components that appear to be offline`);
      
      // Update all offline components in batch
      await prisma.componentDeployment.updateMany({
        where: {
          deploymentId: {
            in: offlineComponents.map(c => c.deploymentId)
          }
        },
        data: {
          connectionStatus: 'offline'
        }
      });

      // Log each offline component
      offlineComponents.forEach(component => {
        console.log(`📴 Component marked offline: ${component.componentType.name} on ${component.device.identifier} (last seen: ${component.lastInteraction})`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking for offline components:', error);
  }
}

/**
 * Starts the periodic monitoring of component status
 */
function startComponentMonitoring() {
  console.log(`🔄 Starting component monitoring (check every ${MONITORING_INTERVAL_MS / 1000}s, offline threshold: ${OFFLINE_THRESHOLD_MINUTES}min)`);
  
  // Initial check
  checkOfflineComponents();
  
  // Set up periodic monitoring
  setInterval(checkOfflineComponents, MONITORING_INTERVAL_MS);
}

/**
 * Maps component IDs from MQTT topics to database component identifiers
 * @param componentId - The component ID from MQTT topic
 * @returns The corresponding component identifier in the database
 */
function getComponentIdentifier(componentId: string): string {
  const mapping: Record<string, string> = {
    'temperature': 'dht11_sensor_temperature',
    'humidity': 'dht11_sensor_humidity',
    'water_temp': 'ds18b20_sensor',
    'water_level': 'water_level_sensor',
    'lux': 'ldr_sensor',
    'motion': 'pir_sensor',
    'light': 'lighting_system',
    'fan1': 'ventilation_fan_1',
    'fan2': 'ventilation_fan_2',
    'pump': 'water_pump',
    'feeder': 'automatic_feeder',
    'servo': 'gate_servo',
  };

  return mapping[componentId] || componentId;
} 