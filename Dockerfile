# ============================================
# Гури — Dockerfile Multi-stage
# ============================================

# ---- Stage 1: Instalar dependências ----
FROM node:22-alpine AS deps

WORKDIR /app

# Copiar arquivos de dependência + prisma (necessário para postinstall: prisma generate)
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci --legacy-peer-deps

# ---- Stage 2: Build da aplicação ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo o código fonte
COPY . .

# Gerar Prisma Client (caso postinstall não tenha rodado corretamente)
RUN npx prisma generate

# Build de produção (gera .output/)
RUN npm run build

# ---- Stage 3: Imagem final de produção ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar o output do build
COPY --from=builder /app/.output ./.output

# Copiar Prisma schema + migrações (necessário para prisma db push)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Copiar todos os node_modules do build
COPY --from=builder /app/node_modules ./node_modules

# Expor porta
EXPOSE 3000

# Script de inicialização
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
