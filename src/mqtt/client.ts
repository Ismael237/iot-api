import mqtt from 'mqtt';
import config from '../config';

const client = mqtt.connect(config.mqtt.brokerUrl, {
  username: config.mqtt.username,
  password: config.mqtt.password,
  reconnectPeriod: 2000,
  connectTimeout: 30000,
  keepalive: 60,
  clean: true,
});

client.on('connect', () => {
  console.log('✅ MQTT connected successfully');
  console.log(`📡 Broker: ${config.mqtt.brokerUrl}`);
});

client.on('reconnect', () => {
  console.log('🔄 MQTT reconnecting...');
});

client.on('error', (err) => {
  console.error('❌ MQTT error:', err);
});

client.on('close', () => {
  console.log('🔌 MQTT connection closed');
});

client.on('offline', () => {
  console.log('📴 MQTT client offline');
});

client.on('message', (topic, message) => {
  console.log(`📨 MQTT message received: ${topic} (${message.length} bytes)`);
});

export default client; 