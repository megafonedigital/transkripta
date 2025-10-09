# Use imagem leve do Node
FROM node:20-alpine AS base

WORKDIR /app

# Base de dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Fase de build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Fase de execução
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instalar apenas dependências de produção
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar artefatos de build e estáticos
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]