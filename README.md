# 🌐 API IoT - Plateforme de Gestion d'Appareils Connectés

> **API IoT moderne et complète** pour la gestion d'écosystèmes d'appareils connectés avec automatisation intelligente et monitoring en temps réel.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-blue.svg)](https://fastify.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![MQTT](https://img.shields.io/badge/MQTT-5.x-orange.svg)](https://mqtt.org/)

---

## ✨ Fonctionnalités principales

- **🔐 Authentification JWT** avec tokens de rafraîchissement sécurisés
- **🏠 Gestion d'appareils IoT** (ESP32, Arduino, Raspberry Pi, capteurs, actionneurs)
- **📊 Collecte de données** en temps réel avec agrégations et statistiques
- **⚡ Contrôle d'actionneurs** à distance via MQTT bidirectionnel
- **🏗️ Organisation hiérarchique** avec système de zones personnalisables
- **🤖 Règles d'automatisation** programmables avec conditions complexes
- **🚨 Système d'alertes** intelligent avec niveaux de sévérité
- **📡 Communication MQTT** robuste avec gestion des déconnexions

---

## 🚀 Démarrage ultra-rapide

### Option 1: Docker (Recommandé)
```bash
# Démarrer tous les services (API + PostgreSQL + MQTT)
docker compose up -d

# L'API est accessible sur http://localhost:3000
```

### Option 2: Installation locale
```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer l'environnement
cp .env.example .env

# 3. Initialiser la base de données
pnpm db:migrate && pnpm db:seed

# 4. Démarrer en développement
pnpm dev
```

### 🧪 Tester l'installation
```bash
# Exécuter les tests automatisés complets
./test_api.sh

# Ou test manuel simple
curl http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

---

## 📚 Documentation complète

| 📖 Guide | 📝 Description | 🔗 Lien |
|----------|----------------|---------|
| **🎯 Documentation complète** | Guide principal avec tous les liens | [DOCUMENTATION_COMPLETE.md](./DOCUMENTATION_COMPLETE.md) |
| **📚 API Reference** | Documentation exhaustive des endpoints | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) |
| **🚀 Déploiement local** | Installation et configuration locale | [DEPLOYMENT_LOCAL.md](./DEPLOYMENT_LOCAL.md) |
| **🐳 Déploiement Docker** | Déploiement avec conteneurs | [DEPLOYMENT_DOCKER.md](./DEPLOYMENT_DOCKER.md) |
| **🏗️ Architecture** | Structure détaillée du projet | [devbook.md](./devbook.md) |

---

## 🛠️ Stack technique

| Composant | Technologie | Version | Description |
|-----------|-------------|---------|-------------|
| **Backend** | Node.js + Fastify | 20+ / 4.x | Runtime et framework web haute performance |
| **Base de données** | PostgreSQL + Prisma | 15+ / 5.x | SGBD relationnel avec ORM type-safe |
| **Authentification** | JWT + bcrypt | - | Tokens sécurisés avec hachage |
| **Validation** | Zod | 3.x | Validation runtime avec inférence TypeScript |
| **IoT Communication** | MQTT.js + Mosquitto | 5.x / 2.x | Protocole IoT léger et broker |
| **Containerisation** | Docker + Compose | 24+ | Déploiement simplifié multi-services |
| **Monitoring** | Fastify + Pino | - | Logs structurés haute performance |

---

## 🎯 Cas d'usage

### 🏠 **Domotique résidentielle**
- Contrôle éclairage, chauffage, sécurité
- Automatisation basée sur présence et horaires
- Monitoring consommation énergétique

### 🌱 **Agriculture connectée**
- Surveillance température, humidité, pH
- Irrigation automatique intelligente
- Alertes météo et conditions critiques

### 🏭 **Industrie 4.0**
- Monitoring équipements et machines
- Maintenance prédictive
- Optimisation processus production

### 🏢 **Bâtiments intelligents**
- Gestion HVAC automatisée
- Optimisation énergétique
- Sécurité et contrôle d'accès

---

## 🔧 Configuration rapide

### Variables d'environnement essentielles
```bash
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/iot_api

# Sécurité (IMPORTANT: changer en production)
JWT_SECRET=votre_cle_secrete_minimum_32_caracteres

# Communication IoT
MQTT_BROKER_URL=mqtt://localhost:1883

# Serveur
PORT=3000
NODE_ENV=development
```

### Topics MQTT pré-configurés
```
iot/
├── {device_id}/sensor/{component_id}     # Données capteurs
├── {device_id}/actuator/{component_id}   # Commandes actionneurs
├── {device_id}/status                    # Statut connexion
└── {device_id}/heartbeat                 # Heartbeat périodique
```

---

## 📊 Exemples d'utilisation

### 🔐 Authentification
```bash
# Connexion
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### 🏠 Gestion d'appareils
```bash
# Créer un ESP32
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "ESP32_SALON_01",
    "deviceType": "esp32",
    "ipAddress": "192.168.1.100"
  }'
```

### 📊 Données capteurs
```bash
# Dernières valeurs
curl -X GET http://localhost:3000/api/v1/sensors/readings/latest \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 🤖 Automatisation
```bash
# Créer une règle
curl -X POST http://localhost:3000/api/v1/automation/rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ventilation température",
    "sensorDeploymentId": 1,
    "conditionOperator": ">",
    "conditionValue": 25,
    "actionType": "trigger_actuator"
  }'
```

---

## 🧪 Tests et qualité

### Tests automatisés
```bash
# Test complet de l'API (~35 endpoints)
./test_api.sh

# Tests avec URL personnalisée
./test_api.sh https://your-api-domain.com
```

### Couverture fonctionnelle
- ✅ **Authentication** (inscription, connexion, tokens)
- ✅ **Users** (CRUD utilisateurs, profils)
- ✅ **Devices** (gestion appareils IoT)
- ✅ **Components** (types et déploiements)
- ✅ **Sensors** (relevés, agrégations, stats)
- ✅ **Actuators** (commandes, statuts)
- ✅ **Zones** (hiérarchie, assignations)
- ✅ **Automation** (règles, alertes)

---

## 🔒 Sécurité

### 🛡️ Fonctionnalités de sécurité
- **JWT** avec expiration configurable
- **Refresh tokens** avec révocation
- **Hachage bcrypt** des mots de passe
- **Validation Zod** de toutes les entrées
- **CORS** configurable par environnement
- **Middleware** d'authentification sur routes protégées

### 🔐 Recommandations production
- Utiliser HTTPS (TLS 1.2+)
- Configurer des secrets forts (64+ caractères)
- Limiter les origines CORS
- Activer l'authentification MQTT
- Surveiller les logs de sécurité

---

## 🆘 Support et communauté

### 📞 Obtenir de l'aide
1. **📖 Consultez** la [documentation complète](./DOCUMENTATION_COMPLETE.md)
2. **🔍 Vérifiez** les logs avec `docker compose logs -f`
3. **🧪 Exécutez** les tests automatisés `./test_api.sh`
4. **🐛 Reproduisez** le problème avec des étapes claires

### 🛠️ Dépannage rapide
```bash
# Vérifier les services Docker
docker compose ps

# Logs détaillés
docker compose logs -f api

# Reset complet (⚠️ supprime les données)
docker compose down -v && docker compose up -d
```

---

## 🚀 Roadmap

- [ ] **📱 SDK Mobile** (React Native)
- [ ] **📊 Dashboard temps réel** (React/Vue)
- [ ] **🔌 Plugins** pour plateformes IoT populaires
- [ ] **📈 Analytics avancés** avec IA/ML
- [ ] **🌐 Multi-tenant** pour SaaS
- [ ] **📡 LoRaWAN/Sigfox** support

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

**🎉 Prêt à créer votre écosystème IoT ? Commencez dès maintenant !**

```bash
# Démarrage en 30 secondes
git clone <repository>
cd iot-api
docker compose up -d
./test_api.sh
```

**Happy IoT! 🌐🚀** 