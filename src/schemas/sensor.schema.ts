import { z } from 'zod';

export const readingsQuerySchema = z.object({
  deploymentId: z.coerce.number().int().optional(),
  from: z.coerce.string().datetime().optional(),
  to: z.coerce.string().datetime().optional(),
  limit: z.coerce.number().int().optional(),
  offset: z.coerce.number().int().optional(),
}); 