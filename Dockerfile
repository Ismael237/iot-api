# Image de base : Node.js 20 sur Alpine
FROM node:20-alpine

# Répertoire de travail
WORKDIR /app

# Copie les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installe pnpm et les dépendances
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copie tout le code source
COPY . .

# Installe OpenSSL (requis pour Prisma sur Alpine)
RUN apk add --no-cache openssl

# Génère le client Prisma dans le conteneur
RUN pnpm db:generate

# Compile l’application TypeScript
RUN pnpm build

# Expose le port
EXPOSE 3000

# Démarre l’application
CMD ["pnpm", "start"]