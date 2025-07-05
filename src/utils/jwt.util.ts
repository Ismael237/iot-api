// Ce fichier sera complété lors de l'intégration Fastify, placeholder pour l'instant.
export {};

import jwt from 'jsonwebtoken';
import config from '../config';
import { UserRole } from '@prisma/client';

/**
 * Generates an access token for a given user.
 * @param userId - The ID of the user.
 * @param role - The role of the user.
 * @returns The generated access token.
 */
export function generateAccessToken(userId: number, role: UserRole): string {
  const payload = { userId, role, type: 'access' };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpires });
}

/**
 * Generates a refresh token for a given user.
 * @param userId - The ID of the user.
 * @param role - The role of the user.
 * @returns The generated refresh token.
 */
export function generateRefreshToken(userId: number, role: UserRole): string {
  const payload = { userId, role, type: 'refresh' };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.refreshExpires });
} 