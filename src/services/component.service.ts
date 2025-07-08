import { prisma } from '../config/database';
import { createComponentTypeSchema, createDeploymentSchema } from '../schemas/component.schema';
import { publishDeviceStatus } from '../mqtt/publisher';
import { z } from 'zod';

type CreateComponentTypeInput = z.infer<typeof createComponentTypeSchema>;
type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;

export class ComponentService {
  async listTypes() {
    return await prisma.componentType.findMany({
      select: {
        componentTypeId: true,
        name: true,
        identifier: true,
        category: true,
        unit: true,
        description: true,
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
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createType(data: CreateComponentTypeInput) {
    return await prisma.componentType.create({
      data: {
        name: data.name,
        identifier: data.identifier,
        category: data.category,
        unit: data.unit,
        description: data.description,
      },
      select: {
        componentTypeId: true,
        name: true,
        identifier: true,
        category: true,
        unit: true,
        description: true,
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
      },
    });
  }

  async listDeployments() {
    return await prisma.componentDeployment.findMany({
      select: {
        deploymentId: true,
        active: true,
        lastInteraction: true,
        connectionStatus: true,
        lastValue: true,
        lastValueTs: true,
        createdAt: true,
        updatedAt: true,
        componentType: {
          select: {
            componentTypeId: true,
            name: true,
            identifier: true,
            category: true,
            unit: true,
            description: true,
          },
        },
        device: {
          select: {
            deviceId: true,
            identifier: true,
            deviceType: true,
            model: true,
            active: true,
          },
        },
        creator: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pinConnections: {
          select: {
            pinConnId: true,
            pinIdentifier: true,
            pinFunction: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  
  async getDeploymentDetails(id: number) {
    return await prisma.componentDeployment.findUnique({
      where: { deploymentId: id },
      select: {
        deploymentId: true,
        active: true,
        lastInteraction: true,
        connectionStatus: true,
        lastValue: true,
        lastValueTs: true,
        createdAt: true,
        updatedAt: true,
        componentType: {
          select: {
            componentTypeId: true,
            name: true,
            identifier: true,
            category: true,
            unit: true,
            description: true,
          },
        },
        device: {
          select: {
            deviceId: true,
            identifier: true,
            deviceType: true,
            model: true,
            active: true,
          },
        },
        creator: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pinConnections: {
          select: {
            pinConnId: true,
            pinIdentifier: true,
            pinFunction: true,
          },
        },
      },
    });
  }


  async createDeployment(data: CreateDeploymentInput) {
    const deployment = await prisma.componentDeployment.create({
      data: {
        componentTypeId: data.componentTypeId,
        deviceId: data.deviceId,
        active: data.active ?? true,
        pinConnections: data.pinConnections ? {
          create: data.pinConnections.map(pin => ({
            pinIdentifier: pin.pinIdentifier,
            pinFunction: pin.pinFunction,
          })),
        } : undefined,
      },
      include: {
        componentType: true,
        device: true,
      },
    });

    // Publish device status update when new deployment is created
    try {
      publishDeviceStatus(deployment.device.identifier, {
        status: 'online',
        componentAdded: {
          type: deployment.componentType.identifier,
          category: deployment.componentType.category,
          deploymentId: deployment.deploymentId,
          active: deployment.active,
        },
        timestamp: new Date().toISOString(),
      });
      console.log(`✅ Component deployment created: ${deployment.componentType.name} on ${deployment.device.identifier}`);
    } catch (error) {
      console.error(`❌ Error publishing deployment status:`, error);
    }

    return deployment;
  }

  async updateDeployment(id: number, data: any) {
    const updateData: any = {};
    
    if (data.active !== undefined) updateData.active = data.active;
    if (data.connectionStatus) updateData.connectionStatus = data.connectionStatus;
    if (data.lastValue !== undefined) updateData.lastValue = data.lastValue;
    if (data.lastValueTs) updateData.lastValueTs = data.lastValueTs;
    if (data.lastInteraction) updateData.lastInteraction = data.lastInteraction;

    const deployment = await prisma.componentDeployment.update({
      where: { deploymentId: id },
      data: updateData,
      include: {
        componentType: true,
        device: true,
      },
    });

    // Publish device status update when deployment is modified
    try {
      publishDeviceStatus(deployment.device.identifier, {
        status: 'online',
        componentUpdated: {
          type: deployment.componentType.identifier,
          category: deployment.componentType.category,
          deploymentId: deployment.deploymentId,
          active: deployment.active,
          connectionStatus: deployment.connectionStatus,
          lastValue: deployment.lastValue,
        },
        timestamp: new Date().toISOString(),
      });
      console.log(`✅ Component deployment updated: ${deployment.componentType.name} on ${deployment.device.identifier}`);
    } catch (error) {
      console.error(`❌ Error publishing deployment update:`, error);
    }

    return deployment;
  }

  async getDeployment(id: number) {
    return await prisma.componentDeployment.findUnique({
      where: { deploymentId: id },
      select: {
        deploymentId: true,
        active: true,
        lastInteraction: true,
        connectionStatus: true,
        lastValue: true,
        lastValueTs: true,
        createdAt: true,
        updatedAt: true,
        componentType: {
          select: {
            componentTypeId: true,
            name: true,
            identifier: true,
            category: true,
            unit: true,
            description: true,
          },
        },
        device: {
          select: {
            deviceId: true,
            identifier: true,
            deviceType: true,
            model: true,
            active: true,
          },
        },
        creator: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pinConnections: {
          select: {
            pinConnId: true,
            pinIdentifier: true,
            pinFunction: true,
          },
        },
      },
    });
  }

  async deleteDeployment(id: number) {
    try {
      const deployment = await prisma.componentDeployment.findUnique({
        where: { deploymentId: id },
        include: {
          componentType: true,
          device: true,
        },
      });

      if (deployment) {
        // Publish device status update when deployment is deleted
        try {
          publishDeviceStatus(deployment.device.identifier, {
            status: 'online',
            componentRemoved: {
              type: deployment.componentType.identifier,
              category: deployment.componentType.category,
              deploymentId: deployment.deploymentId,
            },
            timestamp: new Date().toISOString(),
          });
          console.log(`✅ Component deployment removed: ${deployment.componentType.name} from ${deployment.device.identifier}`);
        } catch (error) {
          console.error(`❌ Error publishing deployment removal:`, error);
        }
      }

      await prisma.componentDeployment.delete({
        where: { deploymentId: id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets deployments that haven't been active recently
   */
  async getInactiveDeployments(timeoutMinutes: number = 30) {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    return await prisma.componentDeployment.findMany({
      where: {
        active: true,
        lastInteraction: {
          lt: timeoutDate,
        },
      },
      include: {
        componentType: true,
        device: true,
      },
      orderBy: { lastInteraction: 'desc' },
    });
  }

  /**
   * Gets deployments by device identifier
   */
  async getDeploymentsByDevice(deviceIdentifier: string) {
    return await prisma.componentDeployment.findMany({
      where: {
        device: {
          identifier: deviceIdentifier,
        },
      },
      include: {
        componentType: true,
        device: true,
        pinConnections: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets deployments by component category
   */
  async getDeploymentsByCategory(category: 'sensor' | 'actuator') {
    return await prisma.componentDeployment.findMany({
      where: {
        componentType: {
          category,
        },
        active: true,
      },
      include: {
        componentType: true,
        device: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Updates deployment connection status
   */
  async updateConnectionStatus(deploymentId: number, status: 'online' | 'offline' | 'error' | 'unknown') {
    return await this.updateDeployment(deploymentId, {
      connectionStatus: status,
      lastInteraction: new Date(),
    });
  }
} 