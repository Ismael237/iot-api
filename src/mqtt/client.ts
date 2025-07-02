import mqtt from 'mqtt';
import config from '../config';

const client = mqtt.connect(config.mqtt.brokerUrl, {
  username: config.mqtt.username,
  password: config.mqtt.password,
  reconnectPeriod: 2000,
});

client.on('connect', () => {
  console.log('MQTT connected');
});
client.on('reconnect', () => {
  console.log('MQTT reconnecting...');
});
client.on('error', (err) => {
  console.error('MQTT error:', err);
});
client.on('close', () => {
  console.log('MQTT connection closed');
});

export default client; 