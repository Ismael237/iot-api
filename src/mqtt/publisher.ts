import client from './client';
import { QoS } from 'mqtt';

/**
 * Publishes an MQTT message to a specified topic.
 * @param topic - The MQTT topic to publish to.
 * @param payload - The message payload (string or Buffer).
 * @param qos - The Quality of Service level (0, 1, or 2). Defaults to 0.
 * @param retain - Whether the message should be retained by the broker. Defaults to false.
 */
export function publishMqttMessage(topic: string, payload: string | Buffer, qos: QoS = 0, retain: boolean = false) {
  client.publish(topic, payload, { qos, retain }, (error) => {
    if (error) {
      console.error(`Failed to publish message to topic ${topic}:`, error);
    } else {
      console.log(`Message published to topic: ${topic}`);
    }
  });
} 