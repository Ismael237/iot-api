import { prisma } from '../config/database';

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  async create(data: any) {
    return prisma.user.create({ data });
  },
  async findById(userId: number) {
    return prisma.user.findUnique({ where: { userId } });
  },
  async update(userId: number, data: any) {
    return prisma.user.update({ where: { userId }, data });
  },
}; 