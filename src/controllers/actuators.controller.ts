import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ActuatorService } from '../services/actuator.service';
import { actuatorCommandSchema } from '../schemas/actuator.schema';
import { authenticate, authenticateAdmin, authenticateRole, authenticateAnyRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/common.types';

const actuatorService = new ActuatorService();
const basePath = "/api/v1"

export async function actuatorRoutes(fastify: FastifyInstance) {
  // Get all actuator deployments
  fastify.get(`${basePath}/actuators`, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const actuators = await actuatorService.getActuatorDeployments();
      return reply.send({
        success: true,
        data: actuators,
        count: actuators.length,
      });
    } catch (error) {
      console.error('Error fetching actuators:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch actuators',
      });
    }
  });

  // Send command to actuator
  fastify.post(`${basePath}/actuators/:deploymentId/command`, {
    schema: actuatorCommandSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deploymentId } = request.params as { deploymentId: string };
      const { command, parameters } = request.body as { command: string; parameters?: Record<string, any> };
      
      // Get user ID from JWT token if available
      const userId = (request.user as any)?.userId;

      const result = await actuatorService.sendActuatorCommand(
        parseInt(deploymentId),
        command,
        parameters,
        userId
      );

      return reply.send({
        success: true,
        data: result,
        message: 'Actuator command sent successfully',
      });
    } catch (error) {
      console.error('Error sending actuator command:', error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send actuator command',
      });
    }
  });

  // Get latest commands for an actuator
  fastify.get(`${basePath}/actuators/:deploymentId/commands`, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deploymentId } = request.params as { deploymentId: string };
      const { limit = 10 } = request.query as { limit?: number };

      const commands = await actuatorService.getLatestCommands(parseInt(deploymentId), limit);

      const commandsWithBigInt = commands.map((command) => {
        return {
          ...command,
          commandId: command.commandId.toString()
        }
      });

      return reply.send({
        success: true,
        data: commandsWithBigInt,
        count: commands.length,
      });
    } catch (error) {
      console.error('Error fetching actuator commands:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch actuator commands',
      });
    }
  });

  // Quick commands for common actions
  fastify.post(`${basePath}/actuators/:deploymentId/toggle`, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deploymentId } = request.params as { deploymentId: string };
      const userId = (request.user as any)?.userId;

      // For now, we'll use "1" as ON and "0" as OFF
      // In a real implementation, you'd check the current state
      const command = "1"; // Toggle logic would go here

      const result = await actuatorService.sendActuatorCommand(
        parseInt(deploymentId),
        command,
        { action: 'toggle' },
        userId
      );

      return reply.send({
        success: true,
        data: result,
        message: 'Actuator toggled successfully',
      });
    } catch (error) {
      console.error('Error toggling actuator:', error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle actuator',
      });
    }
  });

  // Get actuator status - accessible aux admins et utilisateurs
  fastify.get(`${basePath}/actuators/:deploymentId/status`, 
    { 
      onRequest: [authenticateAnyRole([UserRole.ADMIN, UserRole.USER])] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const deploymentId = parseInt((req.params as any).deploymentId);
        
        if (isNaN(deploymentId)) {
          reply.code(400).send({ message: 'Invalid deployment ID' });
          return;
        }

        // TODO: Implement actuator status retrieval
        const status = { status: 'unknown' };
        reply.send(status);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reply.code(500).send({ message: 'Error fetching actuator status', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred while fetching actuator status' });
        }
      }
    }
  );

  // Admin-only endpoint for actuator management
  fastify.get(`${basePath}/actuators/admin`, 
    { 
      onRequest: [authenticateAdmin] 
    }, 
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        // TODO: Implement actuator listing for admins
        const actuators: any[] = [];
        reply.send(actuators);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reply.code(500).send({ message: 'Error fetching actuators', error: error.message });
        } else {
          reply.code(500).send({ message: 'An unknown error occurred while fetching actuators' });
        }
      }
    }
  );
} 