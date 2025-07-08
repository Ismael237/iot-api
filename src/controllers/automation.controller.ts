import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AutomationService } from '../services/automation.service';
import { createRuleSchema } from '../schemas/automation.schema';
import { ZodError } from 'zod';

export async function automationController(app: FastifyInstance) {
  const automationService = new AutomationService();

  // List all automation rules
  app.get('/api/v1/automation/rules', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rules = await automationService.listRules();
      reply.send(rules);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching automation rules', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching automation rules' });
      }
    }
  });

  // Create new automation rule
  app.post('/api/v1/automation/rules', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const ruleData = createRuleSchema.parse(req.body);
      const rule = await automationService.createRule(ruleData);
      reply.code(201).send(rule);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        reply.code(400).send({ message: 'Validation failed', errors: error.errors });
      } else if (error instanceof Error) {
        reply.code(500).send({ message: 'Error creating automation rule', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while creating automation rule' });
      }
    }
  });

  // Get rule by ID
  app.get('/api/v1/automation/rules/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const ruleId = parseInt((req.params as any).id);
      
      if (isNaN(ruleId)) {
        reply.code(400).send({ message: 'Invalid rule ID' });
        return;
      }

      const rule = await automationService.getRule(ruleId);
      if (!rule) {
        reply.code(404).send({ message: 'Automation rule not found' });
        return;
      }

      reply.send(rule);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching automation rule', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching automation rule' });
      }
    }
  });

  // Update automation rule
  app.patch('/api/v1/automation/rules/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const ruleId = parseInt((req.params as any).id);
      
      if (isNaN(ruleId)) {
        reply.code(400).send({ message: 'Invalid rule ID' });
        return;
      }

      const ruleData = req.body as any;
      const rule = await automationService.updateRule(ruleId, ruleData);
      
      if (!rule) {
        reply.code(404).send({ message: 'Automation rule not found' });
        return;
      }

      reply.send(rule);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error updating automation rule', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while updating automation rule' });
      }
    }
  });

  // Delete automation rule
  app.delete('/api/v1/automation/rules/:id', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const ruleId = parseInt((req.params as any).id);
      
      if (isNaN(ruleId)) {
        reply.code(400).send({ message: 'Invalid rule ID' });
        return;
      }

      const success = await automationService.deleteRule(ruleId);
      if (!success) {
        reply.code(404).send({ message: 'Automation rule not found' });
        return;
      }

      reply.send({ message: 'Automation rule deleted successfully' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error deleting automation rule', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while deleting automation rule' });
      }
    }
  });

  // Activate/deactivate automation rule
  app.post('/api/v1/automation/rules/:id/activate', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const ruleId = parseInt((req.params as any).id);
      
      if (isNaN(ruleId)) {
        reply.code(400).send({ message: 'Invalid rule ID' });
        return;
      }

      const { isActive } = req.body as any;
      const result = await automationService.activateRule(ruleId, isActive);
      
      if (!result) {
        reply.code(404).send({ message: 'Automation rule not found' });
        return;
      }
      
      reply.send({ message: `Automation rule ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error activating/deactivating automation rule', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while activating/deactivating automation rule' });
      }
    }
  });

  // List all alerts
  app.get('/api/v1/automation/alerts', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const alerts = await automationService.listAlerts();
      reply.send(alerts);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500).send({ message: 'Error fetching alerts', error: error.message });
      } else {
        reply.code(500).send({ message: 'An unknown error occurred while fetching alerts' });
      }
    }
  });
} 