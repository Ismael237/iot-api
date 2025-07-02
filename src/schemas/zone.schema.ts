import { z } from 'zod';

export const createZoneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  parentZoneId: z.number().int().optional(),
});

export const updateZoneSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  parentZoneId: z.number().int().optional(),
}); 