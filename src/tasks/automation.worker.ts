import { AutomationService } from '../services/automation.service';
import config from '../config';

const automationService = new AutomationService();

export function startAutomationWorker() {
  setInterval(async () => {
    try {
      // TODO: fetch and evaluate active rules
      await automationService.listRules();
      // TODO: exécuter actions si conditions remplies
    } catch (err) {
      console.error('Automation worker error:', err);
    }
  }, config.automation.interval);
} 