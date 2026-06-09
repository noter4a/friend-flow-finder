#!/bin/sh
set -e

echo "🚀 Гури — Iniciando..."

# Sincronizar schema do banco de dados MySQL (com retry loop)
echo "📦 Sincronizando schema do banco de dados..."
MAX_RETRIES=15
RETRY_COUNT=0
until npx prisma db push --skip-generate --accept-data-loss; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Erro: Não foi possível conectar ao banco de dados após $MAX_RETRIES tentativas."
    exit 1
  fi
  echo "⏳ Banco de dados ainda não está pronto. Aguardando (tentativa $RETRY_COUNT de $MAX_RETRIES)..."
  sleep 3
done

# Criar admin padrão se não existir via Prisma seed
echo "👤 Verificando admin padrão..."
npx prisma db seed || echo "⚠️ Seed falhou ou já foi executado."

# Iniciar o servidor
echo "✅ Servidor iniciando na porta ${PORT:-3000}..."
exec node .output/server/index.mjs
