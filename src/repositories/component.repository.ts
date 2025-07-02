import { prisma } from '../config/database';

export const componentRepository = {
  async listTypes() {
    return prisma.componentType.findMany();
  },
  async createType(data: any) {
    return prisma.componentType.create({ data });
  },
  async listDeployments() {
    return prisma.componentDeployment.findMany();
  },
  async createDeployment(data: any) {
    return prisma.componentDeployment.create({ data });
  },
  async updateDeployment(id: number, data: any) {
    return prisma.componentDeployment.update({ where: { deploymentId: id }, data });
  },
  async deleteDeployment(id: number) {
    return prisma.componentDeployment.delete({ where: { deploymentId: id } });
  },
}; 