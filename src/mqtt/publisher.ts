import client from './client';

/**
 * Publishes an MQTT message to a specified topic.
 * @param topic - The MQTT topic to publish to.
 * @param payload - The message payload (string or Buffer).
 * @param qos - The Quality of Service level (0, 1, or 2). Defaults to 0.
 * @param retain - Whether the message should be retained by the broker. Defaults to false.
 */
export function publishMqttMessage(topic: string, payload: string | Buffer, qos: number = 0, retain: boolean = false) {
  if (!client.connected) {
    console.error('❌ Cannot publish: MQTT client not connected');
    return;
  }

  client.publish(topic, payload, { qos: qos as any, retain }, (error) => {
    if (error) {
      console.error(`❌ Failed to publish message to topic ${topic}:`, error);
    } else {
      console.log(`✅ Message published to topic: ${topic}`);
    }
  });
}

/**
 * Publishes a command to an actuator on a specific device.
 * @param deviceId - The device identifier (e.g., 'esp32-farm-001').
 * @param actuator - The actuator component (e.g., 'light', 'fan1', 'pump').
 * @param command - The command to send (e.g., '1', '0', 'ON', 'OFF').
 * @param qos - The Quality of Service level. Defaults to 1 for actuator commands.
 * @param retain - Whether the message should be retained. Defaults to true for actuator states.
 */
export function publishActuatorCommand(
  deviceId: string, 
  actuator: string, 
  command: string, 
  qos: number = 1, 
  retain: boolean = true
) {
  const topic = `farm/${deviceId}/actuator/${actuator}/cmd`;
  publishMqttMessage(topic, command, qos, retain);
}

/**
 * Publishes a servo command with angle value.
 * @param deviceId - The device identifier.
 * @param angle - The servo angle (0-180 degrees).
 * @param qos - The Quality of Service level. Defaults to 1.
 * @param retain - Whether the message should be retained. Defaults to true.
 */
export function publishServoCommand(
  deviceId: string, 
  angle: number, 
  qos: number = 1, 
  retain: boolean = true
) {
  const topic = `farm/${deviceId}/actuator/servo/cmd`;
  const command = Math.max(0, Math.min(180, angle)).toString(); // Constrain to 0-180
  publishMqttMessage(topic, command, qos, retain);
}

/**
 * Publishes a status message for a device.
 * @param deviceId - The device identifier.
 * @param status - The status object to publish.
 * @param status - The status object to publish.
 * @param qos - The Quality of Service level. Defaults to 1.
 * @param retain - Whether the message should be retained. Defaults to true.
 */
export function publishDeviceStatus(
  deviceId: string, 
  status: Record<string, any>, 
  qos: number = 1, 
  retain: boolean = true
) {
  const topic = `farm/${deviceId}/status/cmd`;
  const payload = JSON.stringify(status);
  publishMqttMessage(topic, payload, qos, retain);
}

/**
 * Publishes a heartbeat message for a device.
 * @param deviceId - The device identifier.
 * @param timestamp - The heartbeat timestamp. Defaults to current time.
 * @param qos - The Quality of Service level. Defaults to 0.
 * @param retain - Whether the message should be retained. Defaults to false.
 */
export function publishHeartbeat(
  deviceId: string, 
  timestamp?: number, 
  qos: number = 0, 
  retain: boolean = false
) {
  const topic = `farm/${deviceId}/heartbeat/cmd`;
  const payload = (timestamp || Math.floor(Date.now() / 1000)).toString();
  publishMqttMessage(topic, payload, qos, retain);
} 