import { prisma } from '../config/database';
import { createDeviceSchema, updateDeviceSchema } from '../schemas/device.schema';
import { publishDeviceStatus, publishHeartbeat } from '../mqtt/publisher';
import { z } from 'zod';

type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

export class DeviceService {
  async listDevices() {
    return await prisma.ioTDevice.findMany({
      select: {
        deviceId: true,
        identifier: true,
        deviceType: true,
        model: true,
        metadata: true,
        ipAddress: true,
        port: true,
        active: true,
        lastSeen: true,
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

  async createDevice(deviceData: CreateDeviceInput) {
    const device = await prisma.ioTDevice.create({
      data: {
        identifier: deviceData.identifier,
        deviceType: deviceData.device_type,
        model: deviceData.model,
        metadata: deviceData.metadata,
        ipAddress: deviceData.ip_address,
        port: deviceData.port,
        createdBy: deviceData.created_by,
      },
      select: {
        deviceId: true,
        identifier: true,
        deviceType: true,
        model: true,
        metadata: true,
        ipAddress: true,
        port: true,
        active: true,
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

    // Publish initial device status via MQTT
    try {
      publishDeviceStatus(device.identifier, {
        status: 'online',
        ip: device.ipAddress,
        firmware: (device.metadata as any)?.firmware || '1.0',
        uptime: 0,
        deviceType: device.deviceType,
        model: device.model,
      });
      console.log(`✅ Initial status published for device: ${device.identifier}`);
    } catch (error) {
      console.error(`❌ Error publishing initial status for device ${device.identifier}:`, error);
    }

    return device;
  }

  async getDeviceById(deviceId: number) {
    return await prisma.ioTDevice.findUnique({
      where: { deviceId },
      select: {
        deviceId: true,
        identifier: true,
        deviceType: true,
        model: true,
        metadata: true,
        ipAddress: true,
        port: true,
        active: true,
        lastSeen: true,
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
        deployments: {
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
          },
        },
      },
    });
  }

  async updateDevice(deviceId: number, deviceData: UpdateDeviceInput) {
    const updateData: any = {};
    
    if (deviceData.identifier) updateData.identifier = deviceData.identifier;
    if (deviceData.device_type) updateData.deviceType = deviceData.device_type;
    if (deviceData.model) updateData.model = deviceData.model;
    if (deviceData.metadata) updateData.metadata = deviceData.metadata;
    if (deviceData.ip_address) updateData.ipAddress = deviceData.ip_address;
    if (deviceData.port) updateData.port = deviceData.port;
    if (deviceData.active !== undefined) updateData.active = deviceData.active;

    const device = await prisma.ioTDevice.update({
      where: { deviceId },
      data: updateData,
      select: {
        deviceId: true,
        identifier: true,
        deviceType: true,
        model: true,
        metadata: true,
        ipAddress: true,
        port: true,
        active: true,
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

    // Publish updated device status via MQTT
    try {
      publishDeviceStatus(device.identifier, {
        status: device.active ? 'online' : 'offline',
        ip: device.ipAddress,
        firmware: (device.metadata as any)?.firmware || '1.0',
        uptime: (device.metadata as any)?.uptime || 0,
        deviceType: device.deviceType,
        model: device.model,
        lastUpdate: new Date().toISOString(),
      });
      console.log(`✅ Updated status published for device: ${device.identifier}`);
    } catch (error) {
      console.error(`❌ Error publishing updated status for device ${device.identifier}:`, error);
    }

    return device;
  }

  async deleteDevice(deviceId: number) {
    try {
      const device = await prisma.ioTDevice.findUnique({
        where: { deviceId },
        select: { identifier: true }
      });

      if (device) {
        // Publish offline status before deletion
        try {
          publishDeviceStatus(device.identifier, {
            status: 'offline',
            reason: 'device_deleted',
            timestamp: new Date().toISOString(),
          });
          console.log(`✅ Offline status published for deleted device: ${device.identifier}`);
        } catch (error) {
          console.error(`❌ Error publishing offline status for device ${device.identifier}:`, error);
        }
      }

      await prisma.ioTDevice.delete({
        where: { deviceId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sends a heartbeat to a device via MQTT
   */
  async sendHeartbeat(deviceId: number) {
    try {
      const device = await prisma.ioTDevice.findUnique({
        where: { deviceId },
        select: { identifier: true }
      });

      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      publishHeartbeat(device.identifier);
      console.log(`💓 Heartbeat sent to device: ${device.identifier}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error sending heartbeat to device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Publishes a custom status message for a device
   */
  async publishDeviceStatus(deviceId: number, statusData: Record<string, any>) {
    try {
      const device = await prisma.ioTDevice.findUnique({
        where: { deviceId },
        select: { identifier: true }
      });

      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      publishDeviceStatus(device.identifier, statusData);
      console.log(`✅ Custom status published for device: ${device.identifier}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error publishing custom status for device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Gets devices that haven't sent a heartbeat recently
   */
  async getOfflineDevices(timeoutMinutes: number = 5) {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    return await prisma.ioTDevice.findMany({
      where: {
        active: true,
        lastSeen: {
          lt: timeoutDate
        }
      },
      select: {
        deviceId: true,
        identifier: true,
        deviceType: true,
        model: true,
        lastSeen: true,
        ipAddress: true,
      },
      orderBy: { lastSeen: 'desc' }
    });
  }
} 