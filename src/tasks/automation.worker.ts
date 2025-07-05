import { AutomationService } from '../services/automation.service';
import config from '../config';

const automationService = new AutomationService();
let intervalId: NodeJS.Timeout | null = null;

/**
 * Starts the automation worker, periodically evaluating active rules.
 */
export function startAutomationWorker() {
  if (intervalId) {
    console.warn('Automation worker is already running.');
    return;
  }

  const interval = config.automation.interval;
  console.log(`Starting automation worker with interval: ${interval}ms`);

  intervalId = setInterval(async () => {
    try {
      console.log('Evaluating automation rules...');
      await automationService.evaluateRules();
    } catch (error) {
      console.error('Error during automation rule evaluation:', error);
    }
  }, interval);
}

/**
 * Stops the automation worker.
 */
export function stopAutomationWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('Automation worker stopped.');
  }
} 