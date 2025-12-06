# 🚀 AUREON ERP - Guia de Deploy

## 📋 Índice
- [Pré-requisitos](#pré-requisitos)
- [Ambientes](#ambientes)
- [Deploy com Docker](#deploy-com-docker)
- [Deploy Manual](#deploy-manual)
- [Health Checks](#health-checks)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)
- [Rollback](#rollback)

---

## 🔧 Pré-requisitos

### Software Necessário
- **Docker** 20.10+ e **Docker Compose** 2.0+
- **Node.js** 20.x (para deploy manual)
- **PostgreSQL** 15+ (para deploy manual)
- **Git** (para versionamento)

### Portas Necessárias
- `5000` - Backend API
- `5432` - PostgreSQL
- `6379` - Redis (cache)
- `80/443` - Frontend (Nginx)

### Verificar Instalação
```bash
docker --version
docker-compose --version
node --version
npm --version
```

---

## 🌍 Ambientes

### 1. **Development** (Local)
- Database: SQLite
- Hot reload: Nodemon
- Debug: Enabled
- Swagger: Enabled

### 2. **Staging**
- Database: PostgreSQL
- URL: https://staging.aureon.com
- Backups: Diários
- Monitoramento: Básico

### 3. **Production**
- Database: PostgreSQL (redundância)
- URL: https://aureon.com
- Backups: A cada 4 horas
- Monitoramento: Completo (Sentry, DataDog)
- SSL/TLS: Obrigatório

---

## 🐳 Deploy com Docker

### Preparação

1. **Clone o repositório**
```bash
git clone https://github.com/your-org/aureon-erp.git
cd aureon-erp
```

2. **Configure variáveis de ambiente**
```bash
# Para staging
cp .env.staging.example .env.staging
nano .env.staging

# Para production
cp .env.production.example .env.production
nano .env.production
```

**⚠️ IMPORTANTE:** Altere TODAS as senhas e secrets!

3. **Configurar secrets obrigatórios**
```bash
# JWT_SECRET - mínimo 32 caracteres
JWT_SECRET=$(openssl rand -base64 32)

# JWT_REFRESH_SECRET - mínimo 32 caracteres
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# DB_PASSWORD - senha forte do PostgreSQL
DB_PASSWORD=$(openssl rand -base64 24)

# REDIS_PASSWORD - senha forte do Redis
REDIS_PASSWORD=$(openssl rand -base64 24)
```

### Deploy para Staging

```bash
# Dar permissão de execução
chmod +x scripts/deploy.sh

# Executar deploy
./scripts/deploy.sh staging
```

### Deploy para Production

```bash
# Executar deploy
./scripts/deploy.sh production
```

### O que o script faz?

1. ✅ Valida ambiente e dependências
2. ✅ Carrega variáveis de ambiente corretas
3. ✅ Cria backup do banco de dados
4. ✅ Faz pull das imagens (se usando registry)
5. ✅ Build das novas imagens Docker
6. ✅ Para containers antigos
7. ✅ Executa migrations do banco
8. ✅ Inicia novos containers
9. ✅ Verifica health dos serviços
10. ✅ Limpa imagens antigas

### Verificar Status

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de serviço específico
docker-compose logs -f backend
docker-compose logs -f postgres

# Ver uso de recursos
docker stats
```

### Parar/Reiniciar

```bash
# Parar todos os containers
docker-compose down

# Reiniciar serviço específico
docker-compose restart backend

# Reiniciar todos os serviços
docker-compose restart
```

---

## 🔨 Deploy Manual (sem Docker)

### 1. Backend

```bash
cd aureon-backend

# Instalar dependências
npm ci --only=production

# Configurar variáveis de ambiente
cp .env.example .env
nano .env

# Executar migrations
npm run migrate

# Iniciar servidor
NODE_ENV=production npm start
```

### 2. Frontend

```bash
cd aureon-os

# Instalar dependências
npm ci

# Build da aplicação
npm run build

# Servir com Nginx ou servidor estático
# Os arquivos estarão em dist/
```

### 3. PostgreSQL

```bash
# Criar database
sudo -u postgres psql

CREATE DATABASE aureon_production;
CREATE USER aureon WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE aureon_production TO aureon;
\q

# Executar migrations
cd aureon-backend
npm run migrate
```

### 4. Process Manager (PM2)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name aureon-backend

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup
```

---

## 🏥 Health Checks

### Endpoints Disponíveis

#### 1. **Liveness Probe** - `/health`
Verifica se o app está rodando.

```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-06T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

#### 2. **Readiness Probe** - `/ready`
Verifica se o app está pronto para receber tráfego.

```bash
curl http://localhost:5000/ready
```

**Response (Success):**
```json
{
  "status": "ready",
  "timestamp": "2025-12-06T10:30:00.000Z",
  "checks": {
    "database": "connected",
    "models": "loaded",
    "server": "ready"
  }
}
```

**Response (Error):** HTTP 503
```json
{
  "status": "not ready",
  "error": "Database connection failed"
}
```

#### 3. **Detailed Health** - `/health/detailed`
Informações completas do sistema.

```bash
curl http://localhost:5000/health/detailed
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600.5,
  "memory": {
    "rss": "120MB",
    "heapTotal": "80MB",
    "heapUsed": "45MB"
  },
  "database": {
    "status": "connected",
    "latency": "5ms",
    "type": "PostgreSQL"
  },
  "features": {
    "swagger": false,
    "email": true
  }
}
```

### Configurar Health Checks no Docker

Já configurado no `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', ...)"
```

### Configurar Health Checks no Kubernetes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## 📊 Monitoramento

### Logs

```bash
# Logs do Docker
docker-compose logs -f --tail=100

# Logs do servidor (manual deploy)
tail -f logs/production.log

# Filtrar erros
docker-compose logs backend | grep ERROR
```

### Métricas

#### Via Docker Stats
```bash
docker stats aureon-backend aureon-postgres
```

#### Via Endpoint
```bash
# Memória e performance
curl http://localhost:5000/health/detailed | jq '.memory'
```

### Ferramentas Recomendadas

1. **Sentry** - Error tracking
   - Configure `SENTRY_DSN` no `.env`
   - Captura erros automaticamente

2. **DataDog** - APM e métricas
   - Configure `DATADOG_API_KEY` no `.env`
   - Dashboard completo de performance

3. **Prometheus + Grafana** - Métricas customizadas
   - Endpoint `/metrics` (implementar se necessário)

---

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar configuração
docker-compose config

# Verificar variáveis de ambiente
docker-compose exec backend env | grep DB_
```

### Erro de conexão com banco de dados

```bash
# Verificar se postgres está rodando
docker-compose ps postgres

# Testar conexão manualmente
docker-compose exec postgres psql -U aureon -d aureon_production

# Ver logs do postgres
docker-compose logs postgres
```

### Erro "Port already in use"

```bash
# Verificar o que está usando a porta
lsof -i :5000
netstat -ano | findstr :5000  # Windows

# Parar o processo ou mudar a porta no .env
```

### Application crashing

```bash
# Ver últimos logs
docker-compose logs --tail=50 backend

# Verificar memória
docker stats aureon-backend

# Aumentar memória disponível no docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Migrations falhando

```bash
# Executar manualmente
docker-compose exec backend npm run migrate

# Ver status das migrations
docker-compose exec backend npm run migrate:status

# Rollback última migration
docker-compose exec backend npm run migrate:undo
```

### Performance lenta

1. **Verificar índices do banco**
```sql
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
```

2. **Verificar queries lentas**
```sql
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

3. **Habilitar cache Redis**
```bash
# No .env
REDIS_ENABLED=true
CACHE_TTL=3600
```

### SSL/HTTPS não funciona

```bash
# Verificar certificados
ls -la nginx/ssl/

# Gerar certificados Let's Encrypt
certbot certonly --webroot -w /var/www/html -d aureon.com

# Renovar certificados
certbot renew --dry-run
```

---

## ⏪ Rollback

### Rollback Automático

```bash
# Dar permissão
chmod +x scripts/rollback.sh

# Fazer rollback (restaura código anterior)
./scripts/rollback.sh production

# Fazer rollback com restore de database
./scripts/rollback.sh production 20251206_093000
```

### Rollback Manual

```bash
# 1. Parar containers atuais
docker-compose down

# 2. Checkout versão anterior
git log --oneline -n 10  # Ver commits
git checkout <commit-hash>

# 3. Restaurar backup do banco
cat backups/20251206_093000/database.sql | \
  docker-compose exec -T postgres psql -U aureon -d aureon_production

# 4. Rebuild e restart
docker-compose build
docker-compose up -d
```

### Rollback de Migration

```bash
# Ver migrations aplicadas
npm run migrate:status

# Fazer rollback da última
npm run migrate:undo

# Fazer rollback de migration específica
npm run migrate:undo --name migration-name.js
```

---

## 🔐 Segurança

### Checklist de Produção

- [ ] Todas as senhas foram alteradas
- [ ] JWT secrets únicos e longos (32+ chars)
- [ ] SSL/TLS configurado e funcionando
- [ ] Firewall configurado (apenas portas necessárias)
- [ ] Rate limiting habilitado
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (Helmet)
- [ ] Backups automáticos configurados
- [ ] Monitoramento configurado
- [ ] Logs sendo salvos e rotacionados
- [ ] Usuário não-root nos containers
- [ ] Vulnerabilidades auditadas (`npm audit`)

### Hardening do PostgreSQL

```sql
-- Revogar permissões públicas
REVOKE ALL ON DATABASE aureon_production FROM PUBLIC;

-- Criar role read-only para analytics
CREATE ROLE readonly WITH LOGIN PASSWORD 'readonly_pass';
GRANT CONNECT ON DATABASE aureon_production TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
```

---

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Tuning](https://pgtune.leopard.in.ua/)
- [Nginx Best Practices](https://nginx.org/en/docs/)
- [Node.js Production Checklist](https://github.com/goldbergyoni/nodebestpractices)

---

## 🆘 Suporte

Em caso de problemas:

1. Verificar logs: `docker-compose logs -f`
2. Verificar health: `curl http://localhost:5000/health/detailed`
3. Consultar troubleshooting acima
4. Abrir issue no GitHub
5. Contatar equipe de suporte: support@aureon.com

---

**Última atualização:** Dezembro 2025  
**Versão:** 1.0.0  
**Mantido por:** AUREON Team
