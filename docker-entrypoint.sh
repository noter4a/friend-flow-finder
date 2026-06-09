#!/bin/sh
set -e

echo "🚀 Гури — Iniciando..."

# Sincronizar schema do banco de dados MySQL
echo "📦 Sincronizando schema do banco de dados..."
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || echo "⚠️  Schema já sincronizado."

# Iniciar o servidor
echo "✅ Servidor iniciando na porta ${PORT:-3000}..."
exec node .output/server/index.mjs
