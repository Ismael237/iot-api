import { prisma } from '../config/database';

export const sensorRepository = {
  async listReadings(params: any) {
    // TODO: add filters
    return prisma.sensorReading.findMany();
  },
  async latestReadings() {
    // TODO: latest readings
    return [];
  },
  async aggregatedReadings() {
    // TODO: aggregated data
    return [];
  },
  async readingsForDeployment(deploymentId: number) {
    return prisma.sensorReading.findMany({ where: { deploymentId } });
  },
  async statsForDeployment(deploymentId: number) {
    // TODO: stats
    return {};
  },
}; 