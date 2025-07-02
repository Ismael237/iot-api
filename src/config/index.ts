import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  MQTT_BROKER_URL: z.string(),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string(),
  JWT_REFRESH_EXPIRES: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
  AUTOMATION_INTERVAL: z.string().default('10000'),
  CORS_ORIGIN: z.string().optional(),
});

const env = envSchema.parse(process.env);

export default {
  database: { url: env.DATABASE_URL },
  mqtt: {
    brokerUrl: env.MQTT_BROKER_URL,
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessExpires: env.JWT_ACCESS_EXPIRES,
    refreshExpires: env.JWT_REFRESH_EXPIRES,
  },
  server: {
    port: env.PORT ? Number(env.PORT) : 3000,
    env: env.NODE_ENV,
  },
  logging: { level: env.LOG_LEVEL },
  automation: { interval: Number(env.AUTOMATION_INTERVAL) },
  cors: { origin: env.CORS_ORIGIN },
};
export type AppConfig = typeof env; 