import client from './client';

export function registerMqttHandlers() {
  // Exemple: souscrire aux topics
  client.subscribe('iot/+/sensor/+');
  client.subscribe('iot/+/status');
  client.subscribe('iot/+/heartbeat');

  client.on('message', (topic, message) => {
    // TODO: router selon topic
    console.log('MQTT message', topic, message.toString());
  });
} 