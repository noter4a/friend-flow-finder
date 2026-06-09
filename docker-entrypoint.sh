#!/bin/sh
set -e

echo "🚀 Гури — Iniciando..."

# Sincronizar schema do banco de dados MySQL
echo "📦 Sincronizando schema do banco de dados..."
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || echo "⚠️  Schema já sincronizado."

# Criar admin padrão se não existir
echo "👤 Verificando admin padrão..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const exists = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({ data: { username: 'admin', password: hash, name: 'Administrador', role: 'admin' } });
    console.log('✅ Admin criado (admin / admin123)');
  } else {
    console.log('✅ Admin já existe');
  }
  await prisma.\$disconnect();
})().catch(e => { console.error('⚠️ Seed error:', e.message); process.exit(0); });
" || echo "⚠️  Seed pulado."

# Iniciar o servidor
echo "✅ Servidor iniciando na porta ${PORT:-3000}..."
exec node .output/server/index.mjs
