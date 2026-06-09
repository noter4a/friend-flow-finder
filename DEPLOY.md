# 🚀 Deploy na VPS Ubuntu — Гури (Docker)

Guia completo para subir o projeto Гури em uma VPS Ubuntu com Docker.

---

## Pré-requisitos

- VPS com Ubuntu 24/26
- Acesso SSH (root ou usuário com sudo)
- Domínio apontando para o IP da VPS (opcional, para HTTPS)

---

## 1. Instalar Docker e Docker Compose

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y ca-certificates curl gnupg

# Adicionar chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Adicionar repositório do Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine e Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Adicionar seu usuário ao grupo docker (para rodar sem sudo)
sudo usermod -aG docker $USER

# Aplicar permissão (precisa relogar ou rodar newgrp)
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

---

## 2. Clonar o projeto

```bash
# Criar diretório e clonar
sudo mkdir -p /var/www/guri
sudo chown $USER:$USER /var/www/guri
cd /var/www/guri
git clone https://github.com/noter4a/friend-flow-finder.git .
```

---

## 3. Subir o container

```bash
cd /var/www/guri

# Construir a imagem e iniciar o container
docker compose up -d --build
```

Pronto! O app já está rodando na porta `3000`. Teste com:

```bash
curl http://localhost:3000
```

### Comandos úteis

```bash
# Ver logs em tempo real
docker compose logs -f

# Ver status do container
docker compose ps

# Parar o container
docker compose down

# Reiniciar
docker compose restart

# Rebuild completo (após mudanças no código)
docker compose up -d --build
```

---

## 4. Atualizar o sistema (redeploy)

Quando fizer alterações no código e subir para o GitHub:

```bash
cd /var/www/guri

# 1. Puxar alterações
git pull

# 2. Reconstruir e reiniciar o container
docker compose up -d --build
```

Só isso! O Docker cuida de instalar dependências, rodar migrações do banco e iniciar o servidor automaticamente.

---

## 5. Configurar Nginx (proxy reverso)

```bash
# Instalar Nginx
sudo apt install -y nginx

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
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 6. SSL com Certbot (HTTPS gratuito)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado (substitua pelo seu domínio)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

---

## 7. Firewall (UFW)

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 🗄️ Backup do banco de dados

O banco SQLite fica dentro do volume Docker `guri-data`. Para fazer backup:

```bash
# Descobrir onde o volume está no host
docker volume inspect guri_guri-data

# Backup copiando do container
docker cp guri-app:/app/data/guri.db ./guri-backup-$(date +%Y%m%d).db

# Backup agendado (cron, todo dia às 3h)
crontab -e
# Adicione:
# 0 3 * * * docker cp guri-app:/app/data/guri.db /var/www/guri/backups/guri-backup-$(date +\%Y\%m\%d).db
```

---

## 🔍 Acessar o banco de dados (debug)

Para inspecionar o banco de dados diretamente:

```bash
# Entrar no container
docker exec -it guri-app sh

# Dentro do container, usar o sqlite3 ou prisma
npx prisma studio
```

> ⚠️ **Não deixe o Prisma Studio rodando em produção**. Use apenas para debug pontual.
