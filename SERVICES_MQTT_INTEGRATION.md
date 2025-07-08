# 🔧 Intégration MQTT dans les Services

## 📋 Vue d'ensemble

Ce guide détaille l'intégration MQTT dans tous les services de l'application IoT. Chaque service a été modifié pour utiliser les fonctions MQTT appropriées.

## 🏗️ Services modifiés

### 1. **DeviceService** (`src/services/device.service.ts`)

#### Nouvelles fonctionnalités MQTT :
- **Publication automatique** du statut lors de la création/modification/suppression d'appareils
- **Heartbeat** envoyé à tous les appareils
- **Statuts personnalisés** pour les appareils
- **Détection d'appareils hors ligne**

#### Méthodes ajoutées :
```typescript
// Envoie un heartbeat à un appareil spécifique
await deviceService.sendHeartbeat(deviceId);

// Publie un statut personnalisé
await deviceService.publishDeviceStatus(deviceId, statusData);

// Récupère les appareils hors ligne
const offlineDevices = await deviceService.getOfflineDevices(5); // 5 minutes
```

#### Exemple d'utilisation :
```typescript
import { DeviceService } from './services/device.service';

const deviceService = new DeviceService();

// Créer un appareil (publie automatiquement le statut)
const device = await deviceService.createDevice({
  identifier: 'esp32-farm-002',
  device_type: 'esp32',
  model: 'ESP32 DevKit',
  // ...
});

// Envoyer un heartbeat
await deviceService.sendHeartbeat(device.deviceId);

// Publier un statut personnalisé
await deviceService.publishDeviceStatus(device.deviceId, {
  status: 'maintenance',
  reason: 'firmware_update',
  progress: 75,
});
```

### 2. **AutomationService** (`src/services/automation.service.ts`)

#### Nouvelles fonctionnalités MQTT :
- **Exécution automatique** des règles d'automatisation
- **Commandes d'actionneurs** envoyées via MQTT
- **Création d'alertes** en base de données
- **Gestion des cooldowns** pour éviter les déclenchements multiples

#### Méthodes ajoutées :
```typescript
// Exécute les règles d'automatisation pour une lecture de capteur
await automationService.executeRules(sensorDeploymentId, sensorValue);

// Évalue une condition
const shouldTrigger = automationService.evaluateCondition(value, operator, threshold);

// Exécute une action d'actionneur
await automationService.executeActuatorAction(rule);
```

#### Flux d'automatisation :
1. **Réception** d'une lecture de capteur via MQTT
2. **Déclenchement** automatique des règles d'automatisation
3. **Évaluation** des conditions (température > 35°C, etc.)
4. **Exécution** des actions (allumer ventilateur, créer alerte)
5. **Publication** des commandes via MQTT

#### Exemple de règle d'automatisation :
```typescript
// Règle : Si température > 35°C, allumer le ventilateur
const rule = {
  name: 'Temperature Ventilation',
  sensorDeploymentId: 1, // Capteur de température
  operator: 'gt',
  thresholdValue: 35,
  actionType: 'trigger_actuator',
  targetDeploymentId: 2, // Ventilateur
  actuatorCommand: '1', // ON
  cooldownMinutes: 5,
};
```

### 3. **SensorService** (`src/services/sensor.service.ts`)

#### Nouvelles fonctionnalités MQTT :
- **Intégration automatique** avec l'automatisation
- **Déclenchement** des règles lors de nouvelles lectures
- **Suivi** des capteurs inactifs
- **Métriques** de performance

#### Méthodes ajoutées :
```typescript
// Ajoute une lecture et déclenche l'automatisation
await sensorService.addSensorReading(deploymentId, value, unit, timestamp);

// Récupère les lectures qui ont déclenché des alertes
const alertReadings = await sensorService.getAlertTriggeringReadings(24);

// Récupère les lectures qui ont déclenché des actionneurs
const actuatorReadings = await sensorService.getActuatorTriggeringReadings(24);

// Récupère les capteurs inactifs
const inactiveSensors = await sensorService.getInactiveSensors(10); // 10 minutes
```

#### Flux de traitement des capteurs :
1. **Réception** du message MQTT du capteur
2. **Validation** des données JSON
3. **Sauvegarde** en base de données
4. **Mise à jour** du statut du déploiement
5. **Déclenchement** des règles d'automatisation
6. **Logging** des activités

### 4. **ComponentService** (`src/services/component.service.ts`)

#### Nouvelles fonctionnalités MQTT :
- **Publication automatique** lors de la création/modification/suppression de déploiements
- **Suivi** des déploiements inactifs
- **Gestion** des statuts de connexion

#### Méthodes ajoutées :
```typescript
// Récupère les déploiements inactifs
const inactiveDeployments = await componentService.getInactiveDeployments(30);

// Récupère les déploiements par appareil
const deviceDeployments = await componentService.getDeploymentsByDevice('esp32-farm-001');

// Récupère les déploiements par catégorie
const sensorDeployments = await componentService.getDeploymentsByCategory('sensor');

// Met à jour le statut de connexion
await componentService.updateConnectionStatus(deploymentId, 'online');
```

#### Messages MQTT publiés automatiquement :
```json
// Création de déploiement
{
  "status": "online",
  "componentAdded": {
    "type": "dht11_sensor",
    "category": "sensor",
    "deploymentId": 1,
    "active": true
  },
  "timestamp": "2024-01-01T12:00:00Z"
}

// Modification de déploiement
{
  "status": "online",
  "componentUpdated": {
    "type": "ventilation_fan",
    "category": "actuator",
    "deploymentId": 2,
    "active": true,
    "connectionStatus": "online",
    "lastValue": 1
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 5. **ActuatorService** (`src/services/actuator.service.ts`)

#### Nouvelles fonctionnalités MQTT :
- **Publication automatique** des commandes via MQTT
- **Logging** de toutes les commandes en base
- **Mapping** automatique des types de composants
- **Validation** des paramètres (ex: angle servo)

#### Méthodes principales :
```typescript
// Envoie une commande à un actionneur
const result = await actuatorService.sendActuatorCommand(
  deploymentId,
  '1', // Commande ON
  { reason: 'manual_control' }, // Paramètres
  userId
);

// Récupère les dernières commandes
const commands = await actuatorService.getLatestCommands(deploymentId, 10);

// Récupère tous les actionneurs
const actuators = await actuatorService.getActuatorDeployments();
```

#### Types de commandes supportées :
- **Digital** : `'0'` (OFF), `'1'` (ON)
- **Servo** : `'90'` (angle 0-180°)
- **PWM** : `'128'` (valeur 0-255)

### 6. **MonitoringService** (`src/services/monitoring.service.ts`) - NOUVEAU

#### Fonctionnalités MQTT :
- **Surveillance** de l'état du système
- **Heartbeat** à tous les appareils
- **Publication** du statut système
- **Métriques** de performance

#### Méthodes principales :
```typescript
// Récupère l'état de santé du système
const health = await monitoringService.getSystemHealth();

// Envoie un heartbeat à tous les appareils
await monitoringService.sendHeartbeatToAllDevices();

// Publie le statut système à tous les appareils
await monitoringService.publishSystemStatus();

// Récupère les appareils nécessitant une attention
const issues = await monitoringService.getDevicesNeedingAttention();

// Récupère l'activité d'automatisation récente
const activity = await monitoringService.getRecentAutomationActivity(24);

// Récupère les métriques de performance
const metrics = await monitoringService.getPerformanceMetrics();
```

#### Métriques de santé du système :
```json
{
  "status": "healthy",
  "score": 85,
  "devices": {
    "total": 2,
    "online": 2,
    "offline": 0,
    "onlinePercentage": 100
  },
  "sensors": {
    "total": 6,
    "active": 6,
    "inactive": 0,
    "activePercentage": 100
  },
  "actuators": {
    "total": 6,
    "active": 5,
    "inactive": 1,
    "activePercentage": 83
  }
}
```

## 🔄 Flux de données complet

### 1. **Réception de données de capteurs**
```
ESP32 → MQTT → Handlers → SensorService → AutomationService → ActuatorService → MQTT → ESP32
```

### 2. **Commande manuelle d'actionneur**
```
API → ActuatorService → MQTT → ESP32 → MQTT → Handlers → Database
```

### 3. **Surveillance système**
```
MonitoringService → MQTT → ESP32 (status/heartbeat)
```

## 📊 Endpoints API disponibles

### Monitoring
```typescript
GET /api/v1/monitoring/health
GET /api/v1/monitoring/devices-needing-attention
GET /api/v1/monitoring/automation-activity
GET /api/v1/monitoring/performance-metrics
POST /api/v1/monitoring/heartbeat-all
POST /api/v1/monitoring/publish-status
```

### Actuateurs
```typescript
GET /api/v1/actuators
POST /api/v1/actuators/:deploymentId/command
GET /api/v1/actuators/:deploymentId/commands
POST /api/v1/actuators/:deploymentId/toggle
```

### Capteurs
```typescript
GET /api/v1/sensors/readings
GET /api/v1/sensors/latest
GET /api/v1/sensors/inactive
GET /api/v1/sensors/alert-triggering
GET /api/v1/sensors/actuator-triggering
```

## 🚀 Utilisation avancée

### Surveillance automatique
```typescript
import { MonitoringService } from './services/monitoring.service';

const monitoring = new MonitoringService();

// Surveillance périodique
setInterval(async () => {
  const health = await monitoring.getSystemHealth();
  if (health.status === 'critical') {
    // Envoyer des alertes
    await monitoring.publishSystemStatus();
  }
}, 60000); // Toutes les minutes
```

### Automatisation personnalisée
```typescript
import { AutomationService } from './services/automation.service';

const automation = new AutomationService();

// Créer une règle personnalisée
await automation.createRule({
  name: 'Custom Temperature Rule',
  sensorDeploymentId: 1,
  operator: 'gt',
  thresholdValue: 30,
  actionType: 'trigger_actuator',
  targetDeploymentId: 2,
  actuatorCommand: '1',
  cooldownMinutes: 3,
});
```

## 🔧 Configuration

### Variables d'environnement requises :
```env
MQTT_BROKER_URL=mqtt://192.168.0.246:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=admin
```

### Initialisation dans l'application :
```typescript
import { registerMqttHandlers } from './mqtt/handlers';

// Dans votre fonction start()
registerMqttHandlers();
```

## 📈 Performance et monitoring

### Métriques disponibles :
- **Lectures de capteurs** par heure/jour
- **Commandes d'actionneurs** par heure/jour
- **Alertes** générées
- **Appareils** en ligne/hors ligne
- **Déploiements** actifs/inactifs

### Logs détaillés :
```
✅ MQTT connected successfully
📨 MQTT message received: farm/esp32-farm-001/sensor/temperature (45 bytes)
✅ Sensor reading added: deployment 1 = 25.5 C
🚨 Rule "Temperature Ventilation" triggered: 35.2 gt 35
🎮 Executing actuator command: esp32-farm-001/fan1 = 1
✅ Actuator command executed successfully via automation
💓 Heartbeat sent to device: esp32-farm-001
📊 Publishing system status to 2 devices
```

---

🎉 **Tous les services sont maintenant intégrés avec MQTT et prêts à fonctionner avec votre système IoT !** 