import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ComponentService } from '../services/component.service';
import { createComponentTypeSchema, createDeploymentSchema } from '../schemas/component.schema';
import { ZodError } from 'zod';

export async function componentsController(app: FastifyInstance) {
  const componentService = new ComponentService();

  // List component types
  app.get('/api/v1/components/types', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const types = await componentService.listTypes();
      reply.send(types);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching component types', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching component types' });
      }
    }
  });

  // Create component type
  app.post('/api/v1/components/types', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const typeData = createComponentTypeSchema.parse(req.body);
      const type = await componentService.createType(typeData);
      reply.code(201).send(type);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error creating component type', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while creating component type' });
      }
    }
  });

  // List deployments
  app.get('/api/v1/components/deployments', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deployments = await componentService.listDeployments();
      reply.send(deployments);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching deployments', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching deployments' });
      }
    }
  });

  // // List deployments by device
  // app.get('/api/v1/components/deployments/:deviceId', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
  //   try {
  //     const deviceId = parseInt((req.params as any).deviceId);
      
  //     if (isNaN(deviceId)) {
  //       reply.code(400).send({ message: 'Invalid device ID' });
  //       return;
  //     }

  //     const deployments = await componentService.listDeploymentsByDevice(deviceId);
  //     reply.send(deployments);
  //   } catch (error: unknown) {
  //     if (error instanceof Error) {
  //       reply.code(500).send({ message: 'Error fetching deployments', error: error.message });
  //     } else {
  //       reply.code(500).send({ message: 'An unknown error occurred while fetching deployments' });
  //     }
  //   }
  // });

  // deployments details
  app.get('/api/v1/components/deployments/:deploymentId', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deploymentId = parseInt((req.params as any).deploymentId);
      
      if (isNaN(deploymentId)) {
        reply.code(400).send({ message: 'Invalid deployment ID' });
        return;
      }

      const deployment = await componentService.getDeploymentDetails(deploymentId);
      if (!deployment) {
        reply.code(404).send({ message: 'Deployment not found' });
        return;
      }

      reply.send(deployment);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching deployment details', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching deployment details' });
      }
    }
  });

  // Create deployment
  app.post('/api/v1/components/deployments', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deploymentData = createDeploymentSchema.parse(req.body);
      const deployment = await componentService.createDeployment(deploymentData);
      reply.code(201).send(deployment);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error creating deployment', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while creating deployment' });
      }
    }
  });

  // Update deployment
  app.patch('/api/v1/components/deployments/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deploymentId = parseInt((req.params as any).id);
      
      if (isNaN(deploymentId)) {
        reply.code(400).send({ message: 'Invalid deployment ID' });
        return;
      }

      const deploymentData = req.body as any;
      const deployment = await componentService.updateDeployment(deploymentId, deploymentData);
      
      if (!deployment) {
        reply.code(404).send({ message: 'Deployment not found' });
        return;
      }

      reply.send(deployment);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error updating deployment', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while updating deployment' });
      }
    }
  });

  // Delete deployment
  app.delete('/api/v1/components/deployments/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const deploymentId = parseInt((req.params as any).id);
      
      if (isNaN(deploymentId)) {
        reply.code(400).send({ message: 'Invalid deployment ID' });
        return;
      }

      const success = await componentService.deleteDeployment(deploymentId);
      if (!success) {
        reply.code(404).send({ message: 'Deployment not found' });
        return;
      }

      reply.send({ message: 'Deployment deleted successfully' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error deleting deployment', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while deleting deployment' });
      }
    }
  });
} 