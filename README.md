# IoT API

API IoT moderne basée sur Fastify, Prisma, MQTT, JWT, Zod.

## Stack
- Node.js 18+
- Fastify 4.x
- Prisma 5.x (PostgreSQL)
- MQTT.js
- Auth JWT
- Zod (validation)

## Démarrage rapide

```sh
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Structure du projet
Voir `devbook.md` pour l'architecture détaillée. 