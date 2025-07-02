import { prisma } from '../config/database';

export const automationRepository = {
  async listRules() {
    return prisma.automationRule.findMany();
  },
  async createRule(data: any) {
    return prisma.automationRule.create({ data });
  },
  async getRule(id: number) {
    return prisma.automationRule.findUnique({ where: { ruleId: id } });
  },
  async updateRule(id: number, data: any) {
    return prisma.automationRule.update({ where: { ruleId: id }, data });
  },
  async deleteRule(id: number) {
    return prisma.automationRule.delete({ where: { ruleId: id } });
  },
  async activateRule(id: number, isActive: boolean) {
    return prisma.automationRule.update({ where: { ruleId: id }, data: { isActive } });
  },
  async listAlerts() {
    return prisma.alert.findMany();
  },
}; 