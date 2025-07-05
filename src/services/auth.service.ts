import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import { prisma } from '../config/database';
import { loginSchema } from '../schemas/auth.schema';
import { createUserSchema } from '../schemas/user.schema';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { User, UserRole } from '@prisma/client';

type UserRegisterInput = typeof createUserSchema._type;
type UserLoginInput = typeof loginSchema._type;

export class AuthService {
  /**
   * Registers a new user.
   * @param data - User registration data.
   * @returns The newly created user.
   */
  async register(data: UserRegisterInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.user, // Default to 'user' if not provided
      },
    });
    return user;
  }

  /**
   * Logs in a user and generates access and refresh tokens.
   * @param data - User login data.
   * @returns An object containing access token, refresh token, and user information.
   * @throws Error if authentication fails.
   */
  async login(data: UserLoginInput): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.userId, user.role);
    const refreshToken = generateRefreshToken(user.userId, user.role);

    // Decode the refresh token to get its expiration time
    const decodedRefreshToken = jwt.verify(refreshToken, config.jwt.secret) as { exp: number };

    // Store refresh token in DB (for logout/refresh)
    await prisma.refreshToken.create({
      data: {
        userId: user.userId,
        tokenHash: refreshToken, // In a real app, hash this token too
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });

    return { accessToken, refreshToken, user };
  }

  /**
   * Retrieves a user's profile by their ID.
   * @param userId - The ID of the user.
   * @returns The user object or null if not found.
   */
  async getUserProfile(userId: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { userId: userId } });
  }

  /**
   * Refreshes an access token using a valid refresh token.
   * @param refreshToken - The refresh token.
   * @returns A new access token.
   * @throws Error if the refresh token is invalid or expired.
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as { userId: number; role: UserRole; exp: number };
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          tokenHash: refreshToken,
          userId: decoded.userId,
          expiresAt: { gt: new Date() },
        },
      });

      if (!storedToken) {
        throw new Error('Invalid or expired refresh token');
      }

      const newAccessToken = generateAccessToken(decoded.userId, decoded.role);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logs out a user by blacklisting their access and refresh tokens.
   * @param userId - The ID of the user logging out.
   * @param accessToken - The access token to blacklist.
   * @param refreshToken - The refresh token to blacklist.
   */
  async logout(userId: number, accessToken: string, refreshToken: string): Promise<void> {
    const decodedAccessToken = jwt.verify(accessToken, config.jwt.secret) as { jti: string; exp: number; userId: number; role: UserRole; type: string };

    // Blacklist access token
    await prisma.tokenBlacklist.create({
      data: {
        tokenJti: decodedAccessToken.jti,
        tokenType: 'access',
        userId: userId,
        expiresAt: new Date(decodedAccessToken.exp * 1000), // Use decoded access token expiration
        reason: 'logout',
      },
    });

    // Remove refresh token from active tokens
    await prisma.refreshToken.deleteMany({
      where: {
        userId: userId,
        tokenHash: refreshToken,
      },
    });
  }
} 