4# 📡 Guide d'utilisation MQTT

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser les fichiers MQTT modifiés pour votre système IoT de ferme intelligente.

## 📁 Fichiers modifiés

### 1. `src/mqtt/client.ts` ✅
- **Client MQTT amélioré** avec gestion d'erreurs et reconnexion automatique
- **Logging avec emojis** pour une meilleure visibilité
- **Configuration étendue** : timeout, keepalive, etc.

### 2. `src/mqtt/handlers.ts` ✅
- **Traitement asynchrone** avec queue de messages
- **Validation JSON** des payloads reçus
- **Mapping automatique** des composants MQTT vers la base de données
- **Gestion d'erreurs robuste**

### 3. `src/mqtt/publisher.ts` ✅
- **Fonctions spécialisées** pour différents types de commandes
- **Validation des paramètres** (ex: angle servo 0-180°)
- **Gestion de la connexion** avant publication

### 4. `src/services/actuator.service.ts` ✅
- **Service intégré** pour les commandes d'actionneurs
- **Logging en base** de toutes les commandes
- **Mapping automatique** des types de composants

## 🔧 Configuration requise

### Variables d'environnement (`.env`)
```env
MQTT_BROKER_URL=mqtt://192.168.0.246:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=admin
```

### Initialisation dans `src/index.ts`
```typescript
import { registerMqttHandlers } from './mqtt/handlers';

// Dans votre fonction start()
registerMqttHandlers();
```

## 📡 Topics MQTT supportés

### Format des topics
```
farm/esp32-farm-001/sensor/{component}
farm/esp32-farm-001/actuator/{component}
farm/esp32-farm-001/status
farm/esp32-farm-001/heartbeat
```

### Composants supportés
| MQTT Component | Database Component | Type | Description |
|----------------|-------------------|------|-------------|
| `temperature` | `dht11_sensor` | Sensor | Température ambiante |
| `humidity` | `dht11_sensor` | Sensor | Humidité ambiante |
| `water_temp` | `ds18b20_sensor` | Sensor | Température de l'eau |
| `water_level` | `water_level_sensor` | Sensor | Niveau d'eau (%) |
| `lux` | `ldr_sensor` | Sensor | Luminosité (lux) |
| `motion` | `pir_sensor` | Sensor | Détection de mouvement |
| `light` | `lighting_system` | Actuator | Éclairage principal |
| `fan1` | `ventilation_fan` | Actuator | Ventilateur primaire |
| `pump` | `water_pump` | Actuator | Pompe d'eau |
| `fan2` | `ventilation_fan` | Actuator | Ventilateur secondaire |
| `feeder` | `automatic_feeder` | Actuator | Distributeur automatique |
| `servo` | `gate_servo` | Actuator | Contrôle de porte |

## 📨 Format des messages

### Messages de capteurs
```json
{
  "value": 25.5,
  "unit": "C",
  "timestamp": 1234567890
}
```

### Messages de statut
```json
{
  "status": "online",
  "ip": "192.168.1.100",
  "firmware": "1.0",
  "uptime": 3600
}
```

### Messages heartbeat
```
1234567890
```

## 🎮 Utilisation du publisher

### Commandes d'actionneurs
```typescript
import { 
  publishActuatorCommand, 
  publishServoCommand 
} from './mqtt/publisher';

// Allumer l'éclairage
publishActuatorCommand('esp32-farm-001', 'light', '1');

// Éteindre le ventilateur
publishActuatorCommand('esp32-farm-001', 'fan1', '0');

// Contrôler le servo (0-180°)
publishServoCommand('esp32-farm-001', 90);

// Publier un statut
publishDeviceStatus('esp32-farm-001', {
  status: 'online',
  ip: '192.168.1.100',
  firmware: '1.0',
  uptime: 3600
});
```

## 🔌 Utilisation du service ActuatorService

### Envoi de commandes via API
```typescript
import { ActuatorService } from './services/actuator.service';

const actuatorService = new ActuatorService();

// Envoyer une commande
const result = await actuatorService.sendActuatorCommand(
  deploymentId,    // ID du déploiement
  '1',            // Commande (1=ON, 0=OFF)
  { reason: 'manual_control' }, // Paramètres optionnels
  userId          // ID de l'utilisateur
);

// Récupérer les dernières commandes
const commands = await actuatorService.getLatestCommands(deploymentId, 10);

// Récupérer tous les actionneurs
const actuators = await actuatorService.getActuatorDeployments();
```

## 📊 Endpoints API disponibles

### GET `/api/v1/actuators`
- Liste tous les actionneurs disponibles
- Inclut les dernières commandes

### POST `/api/v1/actuators/:deploymentId/command`
- Envoie une commande à un actionneur
- Body: `{ "command": "1", "parameters": {} }`

### GET `/api/v1/actuators/:deploymentId/commands`
- Historique des commandes pour un actionneur
- Query: `?limit=10`

### POST `/api/v1/actuators/:deploymentId/toggle`
- Bascule l'état d'un actionneur

## 🔍 Monitoring et debugging

### Logs disponibles
```
✅ MQTT connected successfully
📡 Broker: mqtt://192.168.0.246:1883
📨 MQTT message received: farm/esp32-farm-001/sensor/temperature (45 bytes)
✅ Sensor reading processed: temperature = 25.5 C
💓 Heartbeat received from esp32-farm-001
✅ Actuator command sent: esp32-farm-001/light = 1
```

### Gestion d'erreurs
- **Validation JSON** : Messages invalides ignorés
- **Mapping automatique** : Composants inconnus loggés
- **Queue asynchrone** : Traitement non-bloquant
- **Reconnexion automatique** : Gestion des déconnexions

## 🚀 Démarrage rapide

1. **Configurer les variables d'environnement**
2. **Initialiser les handlers** dans `src/index.ts`
3. **Tester la connexion** avec un client MQTT
4. **Envoyer des commandes** via l'API ou directement

## 🔧 Personnalisation

### Ajouter un nouveau composant
1. Ajouter dans `getComponentIdentifier()` dans `handlers.ts`
2. Ajouter dans `getMqttComponentId()` dans `actuator.service.ts`
3. Mettre à jour la base de données avec `seed.ts`

### Modifier les topics
Changer les patterns dans `registerMqttHandlers()` :
```typescript
client.subscribe('farm/+/sensor/+', { qos: 0 });
client.subscribe('farm/+/actuator/+', { qos: 1 });
```

## 📈 Performance

- **Traitement asynchrone** : Pas de blocage
- **Queue de messages** : Gestion des pics de trafic
- **QoS appropriés** : 0 pour les capteurs, 1 pour les actionneurs
- **Validation efficace** : Rejet rapide des messages invalides

## 🔒 Sécurité

- **Validation des payloads** : Protection contre les données malformées
- **Mapping strict** : Seuls les composants connus sont traités
- **Logging des erreurs** : Traçabilité complète
- **Gestion des timeouts** : Évite les blocages

---

🎉 **Votre système MQTT est maintenant prêt à fonctionner avec votre ESP32 !** 