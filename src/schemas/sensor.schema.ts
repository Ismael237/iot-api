import { z } from 'zod';

export const readingsQuerySchema = z.object({
  deploymentId: z.number().int().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
}); 