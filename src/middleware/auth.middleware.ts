import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserRole } from '../types/common.types';

// Types pour les payloads JWT
interface JWTPayload {
  userId: number;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Interface étendue pour FastifyRequest avec les propriétés JWT
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: number;
      role: UserRole;
    };
  }
}

/**
 * Middleware d'authentification de base
 * Vérifie la présence et la validité du token JWT
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Vérifier que c'est un token d'accès (pas un refresh token)
    if (decoded.type !== 'access') {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid token type' 
      });
    }

    // Ajouter les informations utilisateur à la requête
    request.user = {
      userId: decoded.userId,
      role: decoded.role
    };

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal Server Error', 
      message: 'Authentication error' 
    });
  }
}

/**
 * Middleware d'authentification pour les administrateurs uniquement
 */
export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    // D'abord authentifier l'utilisateur
    await authenticate(request, reply);
    
    // Vérifier si l'utilisateur est admin
    if (request.user?.role !== UserRole.ADMIN) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: 'Admin access required' 
      });
    }
  } catch (error) {
    // L'erreur est déjà gérée par authenticate()
    return;
  }
}

/**
 * Middleware d'authentification pour les utilisateurs avec rôle spécifique
 */
export function authenticateRole(requiredRole: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // D'abord authentifier l'utilisateur
      await authenticate(request, reply);
      
      // Vérifier si l'utilisateur a le rôle requis
      if (request.user?.role !== requiredRole) {
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: `Role '${requiredRole}' required` 
        });
      }
    } catch (error) {
      // L'erreur est déjà gérée par authenticate()
      return;
    }
  };
}

/**
 * Middleware d'authentification pour les utilisateurs avec au moins un des rôles spécifiés
 */
export function authenticateAnyRole(requiredRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // D'abord authentifier l'utilisateur
      await authenticate(request, reply);
      
      // Vérifier si l'utilisateur a au moins un des rôles requis
      if (!request.user || !requiredRoles.includes(request.user.role)) {
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: `One of the following roles required: ${requiredRoles.join(', ')}` 
        });
      }
    } catch (error) {
      // L'erreur est déjà gérée par authenticate()
      return;
    }
  };
}

/**
 * Middleware d'authentification optionnelle
 * Ne bloque pas la requête si pas de token, mais ajoute les infos utilisateur si présent
 */
export async function authenticateOptional(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      // Pas de token, mais on continue sans erreur
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    if (decoded.type !== 'access') {
      // Token invalide, mais on continue sans erreur
      return;
    }

    // Ajouter les informations utilisateur à la requête
    request.user = {
      userId: decoded.userId,
      role: decoded.role
    };

  } catch (error) {
    // En cas d'erreur, on continue sans authentification
    return;
  }
}

/**
 * Middleware pour vérifier la propriété d'une ressource
 * L'utilisateur doit être le propriétaire OU avoir le rôle admin
 */
export function authenticateOwnership(getOwnerId: (request: FastifyRequest) => Promise<number | null>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // D'abord authentifier l'utilisateur
      await authenticate(request, reply);
      
      const ownerId = await getOwnerId(request);
      
      if (!ownerId) {
        return reply.code(404).send({ 
          error: 'Not Found', 
          message: 'Resource not found' 
        });
      }
      
      // L'admin peut accéder à toutes les ressources
      if (request.user?.role === UserRole.ADMIN) {
        return;
      }
      
      // L'utilisateur doit être le propriétaire
      if (request.user?.userId !== ownerId) {
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: 'Access denied: not the owner' 
        });
      }
    } catch (error) {
      // L'erreur est déjà gérée par authenticate()
      return;
    }
  };
}

/**
 * Extrait le token JWT de la requête
 * Supporte les headers Authorization et les cookies
 */
function extractTokenFromRequest(request: FastifyRequest): string | null {
  // Vérifier le header Authorization
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Vérifier les cookies
  const tokenCookie = request.cookies?.accessToken;
  if (tokenCookie) {
    return tokenCookie;
  }
  
  // Vérifier le paramètre de requête (pour les cas spéciaux)
  const queryToken = (request.query as any)?.token;
  if (queryToken) {
    return queryToken;
  }
  
  return null;
}

/**
 * Middleware pour rafraîchir un token
 */
export async function refreshToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    const refreshToken = extractRefreshTokenFromRequest(request);
    
    if (!refreshToken) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'No refresh token provided' 
      });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret) as JWTPayload;
    
    // Vérifier que c'est un refresh token
    if (decoded.type !== 'refresh') {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid refresh token' 
      });
    }

    // Générer un nouveau token d'accès
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role, type: 'access' },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpires }
    );

    reply.send({ 
      accessToken: newAccessToken,
      message: 'Token refreshed successfully' 
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired refresh token' 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal Server Error', 
      message: 'Token refresh error' 
    });
  }
}

/**
 * Extrait le refresh token de la requête
 */
function extractRefreshTokenFromRequest(request: FastifyRequest): string | null {
  // Vérifier le header Authorization
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Vérifier les cookies
  const refreshTokenCookie = request.cookies?.refreshToken;
  if (refreshTokenCookie) {
    return refreshTokenCookie;
  }
  
  // Vérifier le body de la requête
  const bodyToken = (request.body as any)?.refreshToken;
  if (bodyToken) {
    return bodyToken;
  }
  
  return null;
} 