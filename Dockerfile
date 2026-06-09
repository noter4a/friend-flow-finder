# ============================================
# Гури — Dockerfile Multi-stage
# ============================================

# ---- Stage 1: Instalar dependências ----
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ---- Stage 2: Build da aplicação ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo o código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build de produção (gera .output/)
RUN npm run build

# ---- Stage 3: Imagem final de produção ----
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar apenas o necessário para o runtime do better-sqlite3
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV PORT=3000

# Copiar o output do build
COPY --from=builder /app/.output ./.output

# Copiar Prisma schema + migrações (necessário para prisma migrate deploy)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Copiar node_modules necessários para o runtime
# (better-sqlite3 precisa dos binários nativos, prisma client precisa do engine)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/prebuild-install ./node_modules/prebuild-install
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

# Criar diretório para o banco de dados (será montado como volume)
RUN mkdir -p /app/data

# Expor porta
EXPOSE 3000

# Script de inicialização: rodar migrações e depois o servidor
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
