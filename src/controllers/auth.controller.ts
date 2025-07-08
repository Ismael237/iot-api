import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../schemas/auth.schema';
import { createUserSchema } from '../schemas/user.schema';
import { ZodError } from 'zod';
import config from '../config';
import ms from 'ms';
import { authenticate, refreshToken } from '../middleware/auth.middleware';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: number;
      role: string;
      jti: string;
      exp: number;
    };
  }
}

export async function authController(app: FastifyInstance) {
  const authService = new AuthService();

  // Register new user
  app.post('/api/v1/auth/register', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userData = createUserSchema.parse(req.body);
      const user = await authService.register(userData);
      reply.code(201).send({ message: 'User registered successfully', userId: user.userId });
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error registering user', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred during registration' });
      }
    }
  });

  // User login
  app.post('/api/v1/auth/login', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await authService.login(loginData);

      reply.setCookie('refreshToken', refreshToken, {
        path: '/api/v1/auth/refresh',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + ms(config.jwt.refreshExpires as ms.StringValue)),
      });

      reply.send({ accessToken, user: { id: user.userId, email: user.email, role: user.role } });
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(401).send({ message: error.message || 'Invalid credentials' });
      } else {
        reply.code(401).send({ message: 'An unknown authentication error occurred' });
      }
    }
  });

  // Refresh access token using middleware
  app.post('/api/v1/auth/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    await refreshToken(req, reply);
  });

  // Alternative refresh endpoint using service directly
  app.post('/api/v1/auth/refresh-service', async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      reply.code(401).send({ message: 'Refresh token missing' });
      return;
    }

    try {
      const { accessToken } = await authService.refresh(refreshToken);
      reply.send({ accessToken });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(401).send({ message: error.message || 'Invalid refresh token' });
      } else {
        reply.code(401).send({ message: 'An unknown token refresh error occurred' });
      }
    }
  });

  // User logout
  app.post('/api/v1/auth/logout', 
    { 
      onRequest: [authenticate] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      const userId = req.user.userId;
      const accessTokenJti = req.user.jti;
      const refreshToken = req.cookies.refreshToken;

      if (!accessTokenJti || !refreshToken) {
        reply.code(400).send({ message: 'Tokens missing for logout' });
        return;
      }

      try {
        await authService.logout(userId, req.raw.headers.authorization?.split(' ')[1] as string, refreshToken);
        reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
        reply.send({ message: 'Logged out successfully' });
      } catch (error: unknown) {
        if (error instanceof Error) {
          reply.code(500).send({ message: 'Error during logout', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred during logout' });
        }
      }
    }
  );

  // Get current user profile
  app.get('/api/v1/auth/me', 
    { 
      onRequest: [authenticate] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = req.user.userId;
        const user = await authService.getUserProfile(userId);
        if (!user) {
          reply.code(404).send({ message: 'User not found' });
          return;
        }
        reply.send({ id: user.userId, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role });
      } catch (error: unknown) {
        if (error instanceof Error) {
          reply.code(500).send({ message: 'Error fetching user profile', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred while fetching user profile' });
        }
      }
    }
  );

  // Validate token endpoint (optional authentication)
  app.get('/api/v1/auth/validate', 
    { 
      onRequest: [authenticate] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        reply.send({ 
          valid: true, 
          user: { 
            id: req.user.userId, 
            role: req.user.role 
          } 
        });
      } catch (error: unknown) {
        reply.code(401).send({ valid: false, message: 'Invalid token' });
      }
    }
  );
} 