import { z } from 'zod';

export const actuatorCommandSchema = z.object({
  command: z.string().min(1),
  parameters: z.record(z.any()).optional(),
}); 