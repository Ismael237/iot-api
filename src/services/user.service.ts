import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password.util';
import { prisma } from '../config/database';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { z } from 'zod';

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export class UserService {
  async listUsers() {
    return await prisma.user.findMany({
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        loginCount: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createUser(userData: CreateUserInput) {
    const { password, ...userDataWithoutPassword } = userData;
    const passwordHash = await hashPassword(password);

    return await prisma.user.create({
      data: {
        ...userDataWithoutPassword,
        passwordHash,
      },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserById(userId: number) {
    return await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        loginCount: true,
      },
    });
  }

  async updateUser(userId: number, userData: UpdateUserInput) {
    const updateData: any = { ...userData };
    
    // Si un nouveau mot de passe est fourni, le hacher
    if (userData.password) {
      updateData.passwordHash = await hashPassword(userData.password);
      delete updateData.password;
    }

    return await prisma.user.update({
      where: { userId },
      data: updateData,
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(userId: number) {
    try {
      await prisma.user.delete({
        where: { userId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
} 