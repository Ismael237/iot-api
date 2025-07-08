import { buildApp } from './app';
import { registerMqttHandlers } from './mqtt/handlers';

const start = async () => {
  const app = buildApp();
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  try {
    // Initialize MQTT handlers
    registerMqttHandlers();
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server ready on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 