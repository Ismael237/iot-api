import { prisma } from '../config/database';
import { createRuleSchema } from '../schemas/automation.schema';
import { publishActuatorCommand, publishServoCommand } from '../mqtt/publisher';
import { z } from 'zod';
import { ComparisonOperator, AutomationActionType } from '@prisma/client';

type CreateRuleInput = z.infer<typeof createRuleSchema>;

export class AutomationService {
  async listRules() {
    return await prisma.automationRule.findMany({
      select: {
        ruleId: true,
        name: true,
        description: true,
        sensorDeploymentId: true,
        operator: true,
        thresholdValue: true,
        actionType: true,
        alertTitle: true,
        alertMessage: true,
        alertSeverity: true,
        targetDeploymentId: true,
        actuatorCommand: true,
        actuatorParameters: true,
        isActive: true,
        cooldownMinutes: true,
        lastTriggeredAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        sensorDeployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
              },
            },
          },
        },
        targetDeployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createRule(data: CreateRuleInput) {
    return await prisma.automationRule.create({
      data: {
        name: data.name,
        description: data.description,
        sensorDeploymentId: data.sensorDeploymentId,
        operator: data.operator as unknown as ComparisonOperator,
        thresholdValue: data.thresholdValue,
        actionType: data.actionType as unknown as AutomationActionType,
        alertTitle: data.alertTitle,
        alertMessage: data.alertMessage,
        alertSeverity: data.alertSeverity,
        targetDeploymentId: data.targetDeploymentId,
        actuatorCommand: data.actuatorCommand,
        actuatorParameters: data.actuatorParameters,
        isActive: data.isActive ?? true,
        cooldownMinutes: data.cooldownMinutes ?? 5,
      },
      select: {
        ruleId: true,
        name: true,
        description: true,
        sensorDeploymentId: true,
        operator: true,
        thresholdValue: true,
        actionType: true,
        alertTitle: true,
        alertMessage: true,
        alertSeverity: true,
        targetDeploymentId: true,
        actuatorCommand: true,
        actuatorParameters: true,
        isActive: true,
        cooldownMinutes: true,
        lastTriggeredAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        sensorDeployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
              },
            },
          },
        },
        targetDeployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
              },
            },
          },
        },
      },
    });
  }

  async getRule(id: number) {
    return await prisma.automationRule.findUnique({
      where: { ruleId: id },
      select: {
        ruleId: true,
        name: true,
        description: true,
        sensorDeploymentId: true,
        operator: true,
        thresholdValue: true,
        actionType: true,
        alertTitle: true,
        alertMessage: true,
        alertSeverity: true,
        targetDeploymentId: true,
        actuatorCommand: true,
        actuatorParameters: true,
        isActive: true,
        cooldownMinutes: true,
        lastTriggeredAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        sensorDeployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
              },
            },
          },
        },
        targetDeployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
              },
            },
          },
        },
      },
    });
  }

  async updateRule(id: number, data: any) {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.sensorDeploymentId) updateData.sensorDeploymentId = data.sensorDeploymentId;
    if (data.operator) updateData.operator = data.operator as unknown as ComparisonOperator;
    if (data.thresholdValue !== undefined) updateData.thresholdValue = data.thresholdValue;
    if (data.actionType) updateData.actionType = data.actionType as unknown as AutomationActionType;
    if (data.alertTitle) updateData.alertTitle = data.alertTitle;
    if (data.alertMessage) updateData.alertMessage = data.alertMessage;
    if (data.alertSeverity) updateData.alertSeverity = data.alertSeverity;
    if (data.targetDeploymentId) updateData.targetDeploymentId = data.targetDeploymentId;
    if (data.actuatorCommand) updateData.actuatorCommand = data.actuatorCommand;
    if (data.actuatorParameters) updateData.actuatorParameters = data.actuatorParameters;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.cooldownMinutes) updateData.cooldownMinutes = data.cooldownMinutes;

    return await prisma.automationRule.update({
      where: { ruleId: id },
      data: updateData,
      select: {
        ruleId: true,
        name: true,
        description: true,
        sensorDeploymentId: true,
        operator: true,
        thresholdValue: true,
        actionType: true,
        alertTitle: true,
        alertMessage: true,
        alertSeverity: true,
        targetDeploymentId: true,
        actuatorCommand: true,
        actuatorParameters: true,
        isActive: true,
        cooldownMinutes: true,
        lastTriggeredAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        sensorDeployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
              },
            },
          },
        },
        targetDeployment: {
          select: {
            deploymentId: true,
            componentType: {
              select: {
                name: true,
                identifier: true,
                category: true,
                unit: true,
              },
            },
            device: {
              select: {
                identifier: true,
                deviceType: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteRule(id: number) {
    try {
      await prisma.automationRule.delete({
        where: { ruleId: id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async activateRule(id: number, isActive: boolean) {
    return await prisma.automationRule.update({
      where: { ruleId: id },
      data: { isActive },
      select: {
        ruleId: true,
        name: true,
        isActive: true,
      },
    });
  }

  async listAlerts() {
    return await prisma.alert.findMany({
      select: {
        alertId: true,
        title: true,
        message: true,
        severity: true,
        createdAt: true,
        creator: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Executes automation rules based on sensor readings
   * This method is called when new sensor data is received
   */
  async executeRules(sensorDeploymentId: number, sensorValue: number) {
    try {
      // Get all active rules for this sensor deployment
      const rules = await prisma.automationRule.findMany({
        where: {
          sensorDeploymentId,
          isActive: true,
        },
        include: {
          sensorDeployment: {
            include: {
              device: true,
              componentType: true,
            },
          },
          targetDeployment: {
            include: {
              device: true,
              componentType: true,
            },
          },
        },
      });

      for (const rule of rules) {
        // Check if rule should be triggered based on cooldown
        if (rule.lastTriggeredAt) {
          const cooldownMs = rule.cooldownMinutes * 60 * 1000;
          const timeSinceLastTrigger = Date.now() - rule.lastTriggeredAt.getTime();
          
          if (timeSinceLastTrigger < cooldownMs) {
            console.log(`⏰ Rule ${rule.name} still in cooldown (${Math.ceil((cooldownMs - timeSinceLastTrigger) / 1000)}s remaining)`);
            continue;
          }
        }

        // Check if condition is met
        const shouldTrigger = this.evaluateCondition(sensorValue, rule.operator, rule.thresholdValue);
        
        if (shouldTrigger) {
          console.log(`🚨 Rule "${rule.name}" triggered: ${sensorValue} ${rule.operator} ${rule.thresholdValue}`);
          
          // Execute the action
          await this.executeRuleAction(rule);
          
          // Update last triggered timestamp
          await prisma.automationRule.update({
            where: { ruleId: rule.ruleId },
            data: { lastTriggeredAt: new Date() },
          });
        }
      }
    } catch (error) {
      console.error('❌ Error executing automation rules:', error);
    }
  }

  /**
   * Evaluates if a condition is met
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'neq': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Executes the action for a triggered rule
   */
  private async executeRuleAction(rule: any) {
    try {
      if (rule.actionType === 'trigger_actuator' && rule.targetDeployment) {
        await this.executeActuatorAction(rule);
      } else if (rule.actionType === 'create_alert') {
        await this.createAlert(rule);
      }
    } catch (error) {
      console.error(`❌ Error executing rule action for "${rule.name}":`, error);
    }
  }

  /**
   * Executes an actuator command via MQTT
   */
  private async executeActuatorAction(rule: any) {
    try {
      const targetDeployment = rule.targetDeployment;
      const deviceIdentifier = targetDeployment.device.identifier;
      const componentId = this.getMqttComponentId(targetDeployment.componentType.identifier);
      const command = rule.actuatorCommand || '1';

      console.log(`🎮 Executing actuator command: ${deviceIdentifier}/${componentId} = ${command}`);

      // Send command via MQTT
      if (componentId === 'servo') {
        const angle = parseInt(command);
        if (!isNaN(angle) && angle >= 0 && angle <= 180) {
          publishServoCommand(deviceIdentifier, angle);
        } else {
          console.error(`❌ Invalid servo angle: ${command}`);
        }
      } else {
        publishActuatorCommand(deviceIdentifier, componentId, command);
      }

      // Log the command in database
      await prisma.actuatorCommand.create({
        data: {
          deploymentId: targetDeployment.deploymentId,
          command,
          parameters: rule.actuatorParameters || {},
          issuedBy: rule.creator?.userId,
        },
      });

      console.log(`✅ Actuator command executed successfully via automation`);
    } catch (error) {
      console.error(`❌ Error executing actuator action:`, error);
    }
  }

  /**
   * Creates an alert in the database
   */
  private async createAlert(rule: any) {
    try {
      await prisma.alert.create({
        data: {
          title: rule.alertTitle || 'Automation Alert',
          message: rule.alertMessage || 'An automation rule was triggered',
          severity: rule.alertSeverity || 'warning',
          createdBy: rule.creator?.userId,
        },
      });

      console.log(`📢 Alert created: ${rule.alertTitle}`);
    } catch (error) {
      console.error(`❌ Error creating alert:`, error);
    }
  }

  /**
   * Maps database component identifiers to MQTT component IDs
   */
  private getMqttComponentId(componentIdentifier: string): string {
    const mapping: Record<string, string> = {
      'lighting_system': 'light',
      'ventilation_fan': 'fan1',
      'water_pump': 'pump',
      'automatic_feeder': 'feeder',
      'gate_servo': 'servo',
    };

    return mapping[componentIdentifier] || componentIdentifier;
  }
} 