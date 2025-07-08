import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { ZodError } from 'zod';
import { authenticateAdmin, authenticateOwnership } from '../middleware/auth.middleware';
import { UserRole } from '../types/common.types';

export async function usersController(app: FastifyInstance) {
  const userService = new UserService();

  // List all users (admin only)
  app.get('/api/v1/users', 
    { 
      onRequest: [authenticateAdmin] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await userService.listUsers();
        reply.send(users);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reply.code(500).send({ message: 'Error fetching users', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred while fetching users' });
        }
      }
    }
  );

  // Create new user (admin only)
  app.post('/api/v1/users', 
    { 
      onRequest: [authenticateAdmin] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const userData = createUserSchema.parse(req.body);
        const user = await userService.createUser(userData);
        reply.code(201).send(user);
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          reply.code(400).send({ message: 'Validation failed', errors: error.errors });
        } else if (error instanceof Error) {
          reply.code(500).send({ message: 'Error creating user', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred while creating user' });
        }
      }
    }
  );

  // Get user by ID - accessible au propriétaire ou admin
  app.get('/api/v1/users/:id', 
    { 
      onRequest: [authenticateOwnership(async (req) => {
        const userId = parseInt((req.params as any).id);
        return isNaN(userId) ? null : userId;
      })] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = parseInt((req.params as any).id);
        
        if (isNaN(userId)) {
          reply.code(400).send({ message: 'Invalid user ID' });
          return;
        }

        const user = await userService.getUserById(userId);
        if (!user) {
          reply.code(404).send({ message: 'User not found' });
          return;
        }

        reply.send(user);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reply.code(500).send({ message: 'Error fetching user', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred while fetching user' });
        }
      }
    }
  );

  // Update user - accessible au propriétaire ou admin
  app.patch('/api/v1/users/:id', 
    { 
      onRequest: [authenticateOwnership(async (req) => {
        const userId = parseInt((req.params as any).id);
        return isNaN(userId) ? null : userId;
      })] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = parseInt((req.params as any).id);
        
        if (isNaN(userId)) {
          reply.code(400).send({ message: 'Invalid user ID' });
          return;
        }

        const userData = updateUserSchema.parse(req.body);
        const user = await userService.updateUser(userId, userData);
        
        if (!user) {
          reply.code(404).send({ message: 'User not found' });
          return;
        }

        reply.send(user);
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          reply.code(400).send({ message: 'Validation failed', errors: error.errors });
        } else if (error instanceof Error) {
          reply.code(500).send({ message: 'Error updating user', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred while updating user' });
        }
      }
    }
  );

  // Delete user (admin only)
  app.delete('/api/v1/users/:id', 
    { 
      onRequest: [authenticateAdmin] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = parseInt((req.params as any).id);
        
        if (isNaN(userId)) {
          reply.code(400).send({ message: 'Invalid user ID' });
          return;
        }

        const deleted = await userService.deleteUser(userId);
        if (!deleted) {
          reply.code(404).send({ message: 'User not found' });
          return;
        }

        reply.send({ message: 'User deleted successfully' });
      } catch (error: unknown) {
        if (error instanceof Error) {
          reply.code(500).send({ message: 'Error deleting user', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred while deleting user' });
        }
      }
    }
  );
} 