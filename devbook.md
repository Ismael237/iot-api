# DevBook TypeScript - API IoT avec Fastify et Prisma

## 1. Architecture Simplifiée

### Stack Technique
- **Runtime** : Node.js 18+
- **Framework API** : Fastify 4.x
- **Base de données** : PostgreSQL 15+
- **ORM** : Prisma 5.x
- **Communication IoT** : mqtt.js
- **Authentification** : @fastify/jwt
- **Validation** : Zod
- **Logger** : Pino (intégré Fastify)
- **Package Manager** : pnpm
- **Bundler** : esbuild
- **TypeScript** : 5.x

### Flux de données
1. **Devices IoT** → MQTT Broker → API (subscriber)
2. **API** → PostgreSQL (stockage sensor_readings)
3. **Frontend/Mobile** → API REST → PostgreSQL
4. **Automation Engine** → API → MQTT → Devices

## 2. Structure du Projet

```
iot-api-ts/
├── src/
│   ├── index.ts                    # Point d'entrée principal
│   ├── app.ts                      # Configuration Fastify
│   ├── config/
│   │   ├── index.ts               # Configuration centralisée
│   │   └── database.ts            # Configuration Prisma
│   │
│   ├── controllers/               # Contrôleurs HTTP
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── devices.controller.ts
│   │   ├── components.controller.ts
│   │   ├── sensors.controller.ts
│   │   ├── actuators.controller.ts
│   │   ├── zones.controller.ts
│   │   └── automation.controller.ts
│   │
│   ├── services/                  # Logique métier
│   │   ├── auth.service.ts
│   │   ├── device.service.ts
│   │   ├── sensor.service.ts
│   │   ├── automation.service.ts
│   │   └── mqtt.service.ts
│   │
│   ├── repositories/              # Accès données
│   │   ├── user.repository.ts
│   │   ├── device.repository.ts
│   │   ├── sensor.repository.ts
│   │   └── automation.repository.ts
│   │
│   ├── schemas/                   # Validation Zod
│   │   ├── auth.schema.ts
│   │   ├── user.schema.ts
│   │   ├── device.schema.ts
│   │   ├── sensor.schema.ts
│   │   └── automation.schema.ts
│   │
│   ├── routes/                    # Définition routes
│   │   ├── v1/
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── devices.routes.ts
│   │   │   ├── components.routes.ts
│   │   │   ├── sensors.routes.ts
│   │   │   ├── actuators.routes.ts
│   │   │   ├── zones.routes.ts
│   │   │   └── automation.routes.ts
│   │   └── index.ts
│   │
│   ├── middleware/                # Middleware Fastify
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── mqtt/                      # Client MQTT
│   │   ├── client.ts
│   │   ├── handlers.ts
│   │   └── publisher.ts
│   │
│   ├── tasks/                     # Tâches background
│   │   └── automation.worker.ts
│   │
│   ├── types/                     # Types TypeScript
│   │   ├── auth.types.ts
│   │   ├── device.types.ts
│   │   ├── sensor.types.ts
│   │   └── common.types.ts
│   │
│   └── utils/                     # Utilitaires
│       ├── jwt.util.ts
│       ├── password.util.ts
│       └── validation.util.ts
│
├── prisma/
│   ├── schema.prisma             # Schéma base de données
│   ├── migrations/               # Migrations générées
│   └── seed.ts                   # Données initiales
│
├── scripts/
│   ├── build.ts                  # Script de build
│   ├── dev.ts                    # Script développement
│   └── create-admin.ts           # Création admin
│
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## 3. Configuration et Variables d'Environnement

### Variables principales (.env)
- **DATABASE_URL** : URL de connexion PostgreSQL
- **MQTT_BROKER_URL** : URL du broker MQTT (format mqtt://host:port)
- **MQTT_USERNAME/PASSWORD** : Credentials MQTT optionnels
- **JWT_SECRET** : Clé secrète pour signature JWT (minimum 32 caractères)
- **JWT_ACCESS_EXPIRES** : Durée expiration access token (ex: "30m")
- **JWT_REFRESH_EXPIRES** : Durée expiration refresh token (ex: "7d")
- **NODE_ENV** : Environment (development/production)
- **PORT** : Port serveur API
- **LOG_LEVEL** : Niveau de logging (info, debug, error)
- **AUTOMATION_INTERVAL** : Intervalle évaluation règles (ms)
- **CORS_ORIGIN** : Origines autorisées pour CORS

### Structure configuration centralisée
- **Validation Zod** de toutes les variables d'environnement
- **Configuration par sections** : database, server, jwt, mqtt, cors, logging, automation
- **Valeurs par défaut** pour variables optionnelles
- **Validation des formats** : URLs, durées, niveaux de log
- **Export des types TypeScript** pour type safety

## 4. Dépendances NPM

### Dépendances principales
- **fastify** : Framework web principal avec plugin système
- **@fastify/cors** : Middleware CORS intégré
- **@fastify/jwt** : Plugin JWT pour Fastify
- **@prisma/client** : Client ORM généré
- **mqtt** : Client MQTT pour Node.js
- **@fastify/jwt** : Gestion tokens JWT
- **bcryptjs** : Hachage mots de passe
- **zod** : Validation schémas TypeScript-first

### Dépendances développement
- **prisma** : CLI et outils développement ORM
- **typescript** : Compilateur TypeScript
- **tsx** : Exécution TypeScript directe (dev)
- **esbuild** : Bundler ultra-rapide pour production
- **@types/node** : Types Node.js
- **@types/bcryptjs** : Types bcrypt

### Scripts package.json
- **dev** : Développement avec hot reload via tsx
- **build** : Build production avec esbuild
- **start** : Démarrage version buildée
- **db:migrate** : Migrations Prisma
- **db:generate** : Génération client Prisma
- **db:seed** : Données initiales

## 5. Modèle de Données PostgreSQL

### Tables principales conservées de la version Python
- **users** : Utilisateurs avec email/password/role
- **refresh_tokens** : Tokens refresh stockés
- **token_blacklist** : Tokens révoqués
- **iot_devices** : Appareils IoT connectés
- **component_types** : Types composants (capteurs/actionneurs)
- **component_deployments** : Instances composants déployés
- **zones** : Zones hiérarchiques
- **sensor_readings** : Relevés capteurs avec index temporel
- **actuator_commands** : Commandes actionneurs avec statut
- **automation_rules** : Règles automatisation avec conditions JSON
- **alerts** : Alertes générées par le système

### Optimisations PostgreSQL
- **Index composites** sur (deployment_id, timestamp) pour sensor_readings
- **JSONB** pour configurations flexibles
- **Contraintes foreign key** avec CASCADE approprié
- **Index partiels** sur colonnes booléennes fréquemment filtrées
- **Types enum** PostgreSQL pour statuts et catégories

### Schema Prisma
- **Relations typées** avec Prisma Client
- **Enums TypeScript** générés automatiquement
- **Timestamps automatiques** avec @default(now()) et @updatedAt
- **Naming conventions** snake_case base → camelCase TypeScript
- **Contraintes** et validations au niveau schéma

## 6. Topics MQTT Optimisés

### Structure simplifiée et hiérarchique
```
{base_topic}/
├── {device_id}/sensor/{component_id}     # Données capteurs
├── {device_id}/actuator/{component_id}   # Commandes actionneurs  
├── {device_id}/status                    # Statut device
└── {device_id}/heartbeat                 # Heartbeat device
```

### Avantages de la nouvelle structure
- **Topics plus courts** et plus lisibles
- **Wildcard filtering** plus efficace (iot/+/sensor/+)
- **Routing simplifié** côté devices
- **Namespace clair** sensor vs actuator
- **Scalabilité** meilleure avec nombreux devices

### Messages formats standardisés
- **Sensor data** : value, unit, timestamp uniquement
- **Actuator commands** : command, parameters, commandId
- **Device status** : status, ip, firmware, uptime
- **Heartbeat** : timestamp simple pour keep-alive

### QoS Strategy
- **QoS 0** pour sensor data (volume élevé, perte acceptable)
- **QoS 1** pour actuator commands (garantie livraison)
- **QoS 1** pour device status (état important)
- **Retained messages** pour derniers status devices

## 7. Architecture en Couches

### Controllers (Présentation)
- **Réception requêtes HTTP** et extraction paramètres
- **Validation** via schémas Zod intégrés Fastify
- **Délégation** logique métier aux services
- **Formatage réponses** et gestion codes HTTP
- **Gestion erreurs** et conversion en réponses appropriées
- **Pagination** et filtrage pour endpoints liste
- **Authentification** via middleware Fastify

### Services (Logique Métier)
- **AuthService** : login, logout, génération/validation tokens
- **DeviceService** : gestion devices, statut, health checks
- **SensorService** : traitement données capteurs, agrégations
- **AutomationService** : évaluation règles, exécution actions
- **MqttService** : communication broker, publication messages

### Repositories (Accès Données)
- **Abstraction** accès base de données via Prisma
- **Requêtes optimisées** avec include/select appropriés
- **Transactions** pour opérations complexes
- **Gestion erreurs** base de données
- **Méthodes réutilisables** pour queries communes
- **Type safety** complet avec Prisma Client

### Avantages architecture
- **Séparation responsabilités** claire
- **Testabilité** améliorée par injection dépendances
- **Réutilisabilité** services entre controllers
- **Maintenance** plus facile
- **Évolutivité** pour nouvelles fonctionnalités

## 8. Validation avec Zod

### Philosophie validation simplifiée
- **Validation essentielle** uniquement (vs validation exhaustive Python)
- **Type inference** automatique TypeScript
- **Validation runtime** avec types compile-time
- **Error messages** clairs et utilisables
- **Composition** schémas pour réutilisabilité

### Schemas par domaine
- **auth.schema** : login, refresh token, password reset
- **user.schema** : création, modification utilisateur
- **device.schema** : CRUD devices, configuration
- **sensor.schema** : queries temporelles, filtres
- **automation.schema** : règles, conditions, actions

### Integration Fastify
- **Validation automatique** via schema route option
- **Error handling** intégré avec réponses JSON standardisées
- **Query parameters** validation avec coercion types
- **Body validation** avec types stricts
- **Response validation** optionnelle pour développement

## 9. API Endpoints avec Versioning

### Structure versioning
- **Prefix /api/v1** pour version actuelle
- **Namespace préparé** pour v2 future
- **Backward compatibility** stratégie définie
- **Deprecation** process pour anciennes versions

### Endpoints Authentication (/api/v1/auth)
- **POST /login** : email/password → access + refresh tokens
- **POST /refresh** : refresh token → nouveau access token
- **POST /logout** : révocation tokens (blacklist)
- **GET /me** : profil utilisateur connecté

### Endpoints Users (/api/v1/users)
- **GET /me** : profil utilisateur
- **PATCH /me** : modification profil
- **GET /** : liste utilisateurs (admin)
- **POST /** : création utilisateur (admin)
- **GET /{id}** : détails utilisateur (admin)
- **PATCH /{id}** : modification utilisateur (admin)

### Endpoints Devices (/api/v1/devices)
- **GET /** : liste devices avec filtres
- **POST /** : création device
- **GET /{id}** : détails device
- **PATCH /{id}** : modification device
- **DELETE /{id}** : suppression device
- **GET /{id}/status** : statut connexion temps réel

### Endpoints Components (/api/v1/components)
- **GET /types** : types composants disponibles
- **POST /types** : création type composant
- **GET /deployments** : déploiements avec filtres
- **POST /deployments** : déploiement sur device
- **PATCH /deployments/{id}** : modification configuration
- **DELETE /deployments/{id}** : suppression déploiement

### Endpoints Sensors (/api/v1/sensors)
- **GET /readings** : relevés avec filtres temporels
- **GET /readings/latest** : dernières valeurs
- **GET /readings/aggregated** : données agrégées
- **GET /{deploymentId}/readings** : relevés capteur spécifique
- **GET /{deploymentId}/stats** : statistiques capteur

### Endpoints Actuators (/api/v1/actuators)
- **POST /{deploymentId}/command** : envoi commande
- **GET /{deploymentId}/commands** : historique commandes
- **GET /{deploymentId}/status** : statut actuateur

### Endpoints Zones (/api/v1/zones)
- **GET /** : zones hiérarchiques
- **POST /** : création zone
- **GET /{id}** : détails zone
- **PATCH /{id}** : modification zone
- **DELETE /{id}** : suppression zone
- **POST /{id}/components/{deploymentId}** : assignation composant

### Endpoints Automation (/api/v1/automation)
- **GET /rules** : règles avec filtres
- **POST /rules** : création règle
- **GET /rules/{id}** : détails règle
- **PATCH /rules/{id}** : modification règle
- **DELETE /rules/{id}** : suppression règle
- **POST /rules/{id}/activate** : activation/désactivation
- **GET /alerts** : alertes générées

### Features communes endpoints
- **Pagination** : limit/offset avec total count
- **Filtrage** : query parameters typés
- **Tri** : orderBy avec direction
- **Inclusion** : relations optionnelles
- **Recherche** : full-text sur champs texte

## 10. Authentification JWT

### Stratégie tokens conservée
- **Access tokens** courte durée (30 minutes par défaut)
- **Refresh tokens** longue durée (7 jours) stockés base
- **Token blacklist** pour révocations immédiates
- **Claims** : userId, type (access/refresh), expiration

### Integration Fastify
- **Plugin @fastify/jwt** pour signature/vérification
- **Middleware authenticate** pour protection routes
- **Decorator request.user** pour accès user connecté
- **Error handling** unifié pour erreurs auth

### Sécurité
- **bcryptjs** pour hachage mots de passe
- **Secrets forts** obligatoires en production
- **Token expiration** configurée par environnement
- **CORS** configuré pour origines autorisées
- **Rate limiting** à implémenter si nécessaire

## 11. Communication MQTT

### Client mqtt.js
- **Auto-reconnection** avec stratégie backoff
- **Connection pooling** pour performances
- **Error handling** robuste avec logging
- **Message queuing** en cas déconnexion temporaire

### Handlers messages
- **Sensor data** : validation, transformation, stockage
- **Device status** : mise à jour statut connexion
- **Heartbeat** : tracking devices actifs
- **Error handling** : messages mal formés, devices inconnus

### Publisher
- **Actuator commands** : publication commandes vers devices
- **Configuration** : envoi config devices
- **Batch operations** : commandes multiples efficaces
- **Response tracking** : correlation commands/acknowledgments

### Topics subscription strategy
- **Wildcard patterns** : iot/+/sensor/+ pour tous capteurs
- **Dynamic subscription** : ajout/suppression selon devices
- **QoS approprié** selon type message
- **Retained handling** : derniers statuts devices

## 12. Background Tasks - Automation

### Worker simple avec setInterval
- **Intervalle configurable** via variable environnement
- **Évaluation cyclique** règles actives uniquement
- **Graceful shutdown** pour arrêt propre
- **Error recovery** : continue malgré erreurs individuelles

### Logique évaluation règles
- **Fetch règles actives** depuis base données
- **Récupération dernières valeurs** capteurs concernés
- **Évaluation conditions** selon type règle
- **Cooldown management** : éviter déclenchements répétés
- **Action execution** : alertes et/ou commandes

### Types conditions supportées
- **Sensor value** : seuils, comparaisons, ranges
- **Time-based** : horaires, jours semaine
- **Device status** : connexion, erreurs
- **Composite** : conditions AND/OR complexes

### Actions possibles
- **Alert creation** : génération alerte avec sévérité
- **Actuator command** : envoi commande via MQTT
- **Email notification** : à implémenter si besoin
- **Webhook** : appel URL externe

### Performance considérations
- **Lazy loading** : chargement données nécessaires uniquement
- **Caching** : valeurs capteurs récentes en mémoire
- **Parallel evaluation** : règles indépendantes en parallèle
- **Monitoring** : temps évaluation et erreurs

## 13. Logging avec Pino

### Configuration intégrée Fastify
- **Logger Pino** automatiquement configuré
- **Structured logging** : JSON par défaut
- **Performance** : logging asynchrone haute performance
- **Levels** : fatal, error, warn, info, debug, trace

### Points logging importants
- **HTTP requests** : automatic request/response logging
- **Authentication** : login attempts, token issues
- **MQTT** : connections, message processing, errors
- **Database** : slow queries, connection issues
- **Automation** : rule evaluations, actions triggered
- **Errors** : structured error information with context

### Configuration par environnement
- **Development** : pretty print, debug level
- **Production** : JSON format, info level
- **Log rotation** : via external tools (logrotate)
- **Centralized logging** : compatible avec ELK, Datadog

## 14. Gestion Erreurs

### Error handling strategy
- **Custom error classes** pour différents types erreurs
- **HTTP status codes** appropriés automatiques
- **Error middleware** global pour formatage réponses
- **Validation errors** : détails champs invalides
- **Database errors** : messages utilisateur friendly

### Types erreurs principales
- **ValidationError** : données invalides (400)
- **AuthenticationError** : auth requise (401)
- **AuthorizationError** : permissions insuffisantes (403)
- **NotFoundError** : ressource inexistante (404)
- **ConflictError** : contraintes business (409)
- **InternalError** : erreurs serveur (500)

### Error responses format
- **Consistent structure** : error, message, details
- **Request tracking** : requestId pour debugging
- **Stack traces** : uniquement en développement
- **User-friendly messages** : pas d'exposition détails techniques

## 15. Build et Déploiement

### Build process
- **esbuild** : bundling ultra-rapide
- **TypeScript compilation** : types checking + transpilation
- **Single bundle** : toutes dépendances incluses
- **Source maps** : debugging production
- **Minification** : optimisation taille

### Environment setup
- **Node.js 18+** : runtime moderne avec performances
- **PostgreSQL 15+** : base données avec Prisma
- **MQTT Broker** : connexion réseau configurée
- **Environment variables** : production values

### Deployment steps
1. **Dependencies** : pnpm install
2. **Database** : migrations + seed data
3. **Build** : compilation TypeScript
4. **Configuration** : environment variables
5. **Start** : node dist/index.js
6. **Health check** : endpoints disponibles

### Production considerations
- **Process manager** : PM2 ou systemd
- **Reverse proxy** : nginx pour SSL/static files
- **Monitoring** : health endpoints, metrics
- **Backups** : base données automatisées
- **Updates** : stratégie déploiement zero-downtime

### Timeline migration suggérée
1. **Setup projet** : structure, dépendances, configuration
2. **Database migration** : Prisma schema + migrations
3. **Authentication** : JWT + middleware
4. **Core endpoints** : users, devices, basic CRUD
5. **MQTT integration** : client + handlers
6. **Sensors/Actuators** : data processing
7. **Automation** : rules evaluation + actions
8. **Testing** : validation fonctionnelle
9. **Production deployment** : monitoring + optimization