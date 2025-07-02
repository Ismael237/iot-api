import { prisma } from '../config/database';

export const zoneRepository = {
  async listZones() {
    return prisma.zone.findMany();
  },
  async createZone(data: any) {
    return prisma.zone.create({ data });
  },
  async getZone(id: number) {
    return prisma.zone.findUnique({ where: { zoneId: id } });
  },
  async updateZone(id: number, data: any) {
    return prisma.zone.update({ where: { zoneId: id }, data });
  },
  async deleteZone(id: number) {
    return prisma.zone.delete({ where: { zoneId: id } });
  },
  async assignComponent(zoneId: number, deploymentId: number, data: any) {
    return prisma.zoneComponentDeployment.create({ data: { ...data, zoneId, deploymentId } });
  },
}; 