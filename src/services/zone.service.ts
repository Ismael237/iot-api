import { prisma } from '../config/database';
import { createZoneSchema, updateZoneSchema } from '../schemas/zone.schema';
import { z } from 'zod';

type CreateZoneInput = z.infer<typeof createZoneSchema>;
type UpdateZoneInput = z.infer<typeof updateZoneSchema>;

export class ZoneService {
  async listZones() {
    return await prisma.zone.findMany({
      select: {
        zoneId: true,
        name: true,
        description: true,
        metadata: true,
        parentZoneId: true,
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
        parentZone: {
          select: {
            zoneId: true,
            name: true,
          },
        },
        subZones: {
          select: {
            zoneId: true,
            name: true,
          },
        },
        componentAssignments: {
          select: {
            zcdId: true,
            assignedAt: true,
            deployment: {
              select: {
                deploymentId: true,
                active: true,
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
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createZone(data: CreateZoneInput) {
    return await prisma.zone.create({
      data: {
        name: data.name,
        description: data.description,
        metadata: data.metadata,
        parentZoneId: data.parentZoneId,
      },
      select: {
        zoneId: true,
        name: true,
        description: true,
        metadata: true,
        parentZoneId: true,
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
        parentZone: {
          select: {
            zoneId: true,
            name: true,
          },
        },
      },
    });
  }

  async getZone(id: number) {
    return await prisma.zone.findUnique({
      where: { zoneId: id },
      select: {
        zoneId: true,
        name: true,
        description: true,
        metadata: true,
        parentZoneId: true,
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
        parentZone: {
          select: {
            zoneId: true,
            name: true,
          },
        },
        subZones: {
          select: {
            zoneId: true,
            name: true,
            description: true,
          },
        },
        componentAssignments: {
          select: {
            zcdId: true,
            assignedAt: true,
            assigner: {
              select: {
                userId: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            deployment: {
              select: {
                deploymentId: true,
                active: true,
                lastInteraction: true,
                connectionStatus: true,
                lastValue: true,
                lastValueTs: true,
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
                    model: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateZone(id: number, data: UpdateZoneInput) {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.metadata) updateData.metadata = data.metadata;
    if (data.parentZoneId) updateData.parentZoneId = data.parentZoneId;

    return await prisma.zone.update({
      where: { zoneId: id },
      data: updateData,
      select: {
        zoneId: true,
        name: true,
        description: true,
        metadata: true,
        parentZoneId: true,
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
        parentZone: {
          select: {
            zoneId: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteZone(id: number) {
    try {
      await prisma.zone.delete({
        where: { zoneId: id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async assignComponent(zoneId: number, deploymentId: number, data: any) {
    return await prisma.zoneComponentDeployment.create({
      data: {
        zoneId,
        deploymentId,
        assignedBy: data.assignedBy,
      },
      select: {
        zcdId: true,
        assignedAt: true,
        assigner: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        zone: {
          select: {
            zoneId: true,
            name: true,
          },
        },
        deployment: {
          select: {
            deploymentId: true,
            active: true,
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
                model: true,
              },
            },
          },
        },
      },
    });
  }
} 