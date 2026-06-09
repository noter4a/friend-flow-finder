#!/bin/sh
set -e

echo "🚀 Гури — Iniciando..."

# Rodar migrações do banco de dados
echo "📦 Aplicando migrações do banco de dados..."
npx prisma migrate deploy 2>/dev/null || echo "⚠️  Migrações já aplicadas ou nenhuma pendente."

# Iniciar o servidor
echo "✅ Servidor iniciando na porta ${PORT:-3000}..."
exec node .output/server/index.mjs
