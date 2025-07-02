import { z } from 'zod';
import { ComparisonOperator, AutomationActionType } from '../types/common.types';

export const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sensorDeploymentId: z.number().int(),
  operator: z.nativeEnum(ComparisonOperator),
  thresholdValue: z.number(),
  actionType: z.nativeEnum(AutomationActionType),
  alertTitle: z.string().optional(),
  alertMessage: z.string().optional(),
  alertSeverity: z.string().optional(),
  targetDeploymentId: z.number().int().optional(),
  actuatorCommand: z.string().optional(),
  actuatorParameters: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  cooldownMinutes: z.number().int().optional(),
}); 