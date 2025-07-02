import { z } from 'zod';
import { ComponentCategory } from '../types/common.types';

export const createComponentTypeSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
  category: z.nativeEnum(ComponentCategory),
  unit: z.string().optional(),
  description: z.string().optional(),
});

export const createDeploymentSchema = z.object({
  componentTypeId: z.number().int(),
  deviceId: z.number().int(),
  active: z.boolean().optional(),
  pinConnections: z.array(z.object({
    pinIdentifier: z.string(),
    pinFunction: z.string(),
  })).optional(),
}); 