import client from './client';

export function publishActuatorCommand(deviceId: string, componentId: string, command: string, parameters?: any) {
  const topic = `iot/${deviceId}/actuator/${componentId}`;
  const payload = JSON.stringify({ command, parameters });
  client.publish(topic, payload, { qos: 1 });
} 