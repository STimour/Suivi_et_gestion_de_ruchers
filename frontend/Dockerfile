# Dockerfile multi-stage pour Next.js
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Installer les dépendances système nécessaires pour sharp
RUN apk add --no-cache libc6-compat

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les dépendances depuis deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1

# Build de l'application
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copier les fichiers de build Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Changer vers l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Lancer l'application
CMD ["node", "server.js"]
