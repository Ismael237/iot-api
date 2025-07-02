import { prisma } from '../config/database';

export const actuatorRepository = {
  async sendCommand(data: any) {
    return prisma.actuatorCommand.create({ data });
  },
  async listCommands(deploymentId: number) {
    return prisma.actuatorCommand.findMany({ where: { deploymentId } });
  },
  async getStatus(deploymentId: number) {
    // TODO: status
    return {};
  },
};
export default actuatorRepository; 