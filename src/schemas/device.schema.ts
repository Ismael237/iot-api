import { z } from 'zod';

export const DeviceTypeEnum = z.enum([
  'arduino_uno',
  'arduino_nano',
  'esp32',
  'esp8266',
  'raspberry_pi',
  'sensor_module',
  'actuator_module',
  'gateway',
]);

export const createDeviceSchema = z.object({
  identifier: z.string().min(3).max(100),
  device_type: DeviceTypeEnum,
  model: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(), // Flexible JSONB metadata
  ip_address: z.string().ip().optional(),
  port: z.number().int().positive().optional(),
  created_by: z.number().int().positive().optional(),
});

export const updateDeviceSchema = z.object({
  identifier: z.string().min(3).max(100).optional(),
  device_type: DeviceTypeEnum.optional(),
  model: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(),
  ip_address: z.string().ip().optional(),
  port: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>; 