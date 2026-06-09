# 🚀 Deploy na VPS Ubuntu — Гури

Guia completo para subir o projeto Гури em uma VPS Ubuntu com banco de dados SQLite.

---

## Pré-requisitos

- VPS com Ubuntu 24/26
- Acesso SSH (root ou usuário com sudo)
- Domínio apontando para o IP da VPS (opcional, para HTTPS)

---

## 1. Instalar Node.js 20 LTS

```bash
# Adicionar repositório oficial do NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt-get install -y nodejs

# Verificar versão
node -v   # Deve mostrar v20.x.x
npm -v
```

---

## 2. Instalar PM2 (gerenciador de processos)

```bash
sudo npm install -g pm2
```

---

## 3. Clonar o projeto

```bash
# Criar diretório para o app
sudo mkdir -p /var/www/guri
sudo chown $USER:$USER /var/www/guri

# Clonar repositório (substitua pela URL do seu repo)
cd /var/www/guri
git clone <URL_DO_SEU_REPOSITORIO> .

# Ou, se for transferir por SCP/SFTP:
# scp -r ./Topzera/* usuario@ip-da-vps:/var/www/guri/
```

---

## 4. Configurar variáveis de ambiente

```bash
# Copiar o exemplo
cp .env.example .env

# Editar as variáveis
nano .env
```

Conteúdo do `.env`:

```env
DATABASE_URL="file:./data/guri.db"
NODE_ENV="production"
PORT=3000
```

---

## 5. Instalar dependências e configurar o banco

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Gerar Prisma Client
npx prisma generate

# Criar o banco de dados e aplicar migrações
mkdir -p data
npx prisma migrate deploy
```

---

## 6. Build de produção

```bash
npm run build
```

Isso gera a pasta `.output/` com o servidor standalone.

---

## 7. Testar localmente

```bash
# Testar se está funcionando
PORT=3000 node .output/server/index.mjs
```

Acesse `http://ip-da-vps:3000` para verificar.

---

## 8. Configurar PM2 (manter o app rodando)

```bash
# Iniciar com PM2
PORT=3000 pm2 start .output/server/index.mjs --name guri

# Salvar config do PM2
pm2 save

# Configurar para iniciar no boot do sistema
pm2 startup
# Execute o comando que ele sugere (sudo env PATH=...)
```

### Comandos úteis do PM2

```bash
pm2 status          # Ver status dos processos
pm2 logs guri       # Ver logs em tempo real
pm2 restart guri    # Reiniciar o app
pm2 stop guri       # Parar o app
pm2 delete guri     # Remover do PM2
```

---

## 9. Configurar Nginx (proxy reverso)

```bash
# Instalar Nginx
sudo apt-get install -y nginx

# Criar configuração do site
sudo nano /etc/nginx/sites-available/guri
```

Cole o seguinte conteúdo (substitua `seu-dominio.com`):

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Aumentar limite de upload (para os documentos RG/CNH)
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar o site
sudo ln -s /etc/nginx/sites-available/guri /etc/nginx/sites-enabled/

# Remover config padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 10. SSL com Certbot (HTTPS gratuito)

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Gerar certificado (substitua pelo seu domínio)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática (já vem configurada, mas teste com)
sudo certbot renew --dry-run
```

---

## 11. Firewall (UFW)

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 📋 Atualizar o sistema (redeploy)

Quando fizer alterações no código:

```bash
cd /var/www/guri

# Puxar alterações
git pull

# Instalar dependências (se mudaram)
npm install --legacy-peer-deps

# Aplicar novas migrações (se houver)
npx prisma migrate deploy

# Rebuild
npm run build

# Reiniciar o app
pm2 restart guri
```

---

## 🗄️ Backup do banco de dados

O banco SQLite fica em `data/guri.db`. Para fazer backup:

```bash
# Backup simples
cp /var/www/guri/data/guri.db /var/www/guri/data/guri-backup-$(date +%Y%m%d).db

# Backup agendado (cron, todo dia às 3h)
crontab -e
# Adicione:
# 0 3 * * * cp /var/www/guri/data/guri.db /var/www/guri/data/guri-backup-$(date +\%Y\%m\%d).db
```

---

## 🔍 Prisma Studio (visualizar banco)

Para ver os dados diretamente no navegador:

```bash
cd /var/www/guri
npx prisma studio
```

Abre uma interface visual em `http://localhost:5555`.

> ⚠️ **Não deixe o Prisma Studio rodando em produção**. Use apenas para debug pontual.
