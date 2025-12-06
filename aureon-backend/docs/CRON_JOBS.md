# Cron Jobs - AUREON Backend

Instruções para configurar cron jobs para manutenção automática do sistema.

## 📋 Jobs Disponíveis

### 1. **Limpeza de Eventos Antigos**
Remove eventos com mais de X dias do banco de dados.

**Script:** `scripts/cleanupOldEvents.js`

**Parâmetros:**
- `dias`: Retenção de eventos (padrão: 90)
- `audit_dias`: Retenção de audit logs (padrão: 365)

**Cron sugerido:** Diariamente às 3h
```bash
0 3 * * * cd /var/www/aureon-backend && NODE_ENV=production node scripts/cleanupOldEvents.js 90 365 >> logs/cleanup.log 2>&1
```

**Exemplo manual:**
```bash
# Remover eventos com mais de 90 dias
node scripts/cleanupOldEvents.js 90

# Remover eventos com mais de 30 dias
node scripts/cleanupOldEvents.js 30
```

---

### 2. **DLQ Retry Automático**
Tenta reprocessar eventos que falharam (Dead Letter Queue).

**Script:** `scripts/runDLQRetry.js`

**Cron sugerido:** A cada 15 minutos
```bash
*/15 * * * * cd /var/www/aureon-backend && NODE_ENV=production node scripts/runDLQRetry.js >> logs/dlq-retry.log 2>&1
```

**Cron horário de negócio:** A cada 15 minutos entre 6h-22h
```bash
*/15 6-22 * * * cd /var/www/aureon-backend && NODE_ENV=production node scripts/runDLQRetry.js >> logs/dlq-retry.log 2>&1
```

**Exemplo manual:**
```bash
node scripts/runDLQRetry.js
```

---

## 🛠️ Configuração no Linux/macOS

### 1. Editar crontab
```bash
crontab -e
```

### 2. Adicionar jobs
```bash
# Limpeza de eventos antigos (diário às 3h)
0 3 * * * cd /var/www/aureon-backend && NODE_ENV=production node scripts/cleanupOldEvents.js 90 365 >> logs/cleanup.log 2>&1

# DLQ Retry (a cada 15 minutos, horário comercial)
*/15 6-22 * * * cd /var/www/aureon-backend && NODE_ENV=production node scripts/runDLQRetry.js >> logs/dlq-retry.log 2>&1
```

### 3. Verificar cron jobs ativos
```bash
crontab -l
```

### 4. Criar diretório de logs
```bash
mkdir -p /var/www/aureon-backend/logs
```

---

## 🪟 Configuração no Windows (Task Scheduler)

### 1. Abrir Task Scheduler
```
Win + R → "taskschd.msc"
```

### 2. Criar Tarefa - Limpeza de Eventos

**Action:** Create Task

**General:**
- Name: `AUREON - Cleanup Old Events`
- Description: `Remove eventos antigos do banco de dados`
- Run whether user is logged on or not

**Triggers:**
- Daily
- Start time: 3:00 AM
- Recur every: 1 day

**Actions:**
- Action: Start a program
- Program: `node.exe`
- Arguments: `scripts\cleanupOldEvents.js 90 365`
- Start in: `C:\path\to\aureon-backend`

**Settings:**
- Allow task to be run on demand
- If task fails, restart every: 1 hour

### 3. Criar Tarefa - DLQ Retry

**General:**
- Name: `AUREON - DLQ Retry`
- Description: `Reprocessar eventos falhados`

**Triggers:**
- Daily
- Repeat task every: 15 minutes
- For a duration of: 16 hours (6h-22h)
- Start time: 6:00 AM

**Actions:**
- Program: `node.exe`
- Arguments: `scripts\runDLQRetry.js`
- Start in: `C:\path\to\aureon-backend`

---

## 📊 Monitoramento

### Verificar logs
```bash
# Últimas 50 linhas do log de cleanup
tail -n 50 logs/cleanup.log

# Últimas 50 linhas do log de DLQ retry
tail -n 50 logs/dlq-retry.log

# Monitorar em tempo real
tail -f logs/dlq-retry.log
```

### Estatísticas via API
```bash
# Obter estatísticas do DLQ retry service
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/events/retry-stats

# Executar retry manual via API
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "priority": "high"}' \
  http://localhost:5000/api/events/retry-batch
```

---

## ⚙️ Configuração de Alertas

### Webhook (opcional)
Adicionar ao `.env`:
```env
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Email (opcional)
Adicionar ao `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL_TO=admin@example.com
```

---

## 🔧 Troubleshooting

### Problema: Cron job não executa

**Verificar:**
1. Permissões do script:
   ```bash
   chmod +x scripts/*.js
   ```

2. Path do Node.js no cron:
   ```bash
   which node
   # Usar path completo no cron: /usr/local/bin/node
   ```

3. Variáveis de ambiente:
   ```bash
   # Adicionar ao início do crontab
   SHELL=/bin/bash
   PATH=/usr/local/bin:/usr/bin:/bin
   NODE_ENV=production
   ```

### Problema: Script falha ao executar

**Debug:**
```bash
# Executar manualmente e verificar erros
cd /var/www/aureon-backend
NODE_ENV=production node scripts/cleanupOldEvents.js 90 2>&1 | tee test.log
```

### Problema: Logs não são criados

**Verificar permissões:**
```bash
# Criar diretório de logs com permissões corretas
mkdir -p logs
chmod 755 logs

# Verificar se usuário do cron pode escrever
touch logs/test.log
ls -la logs/
```

---

## 📈 Recomendações de Performance

### Produção (alto volume)
```bash
# Limpeza mais agressiva (30 dias)
0 3 * * * cd /var/www/aureon-backend && NODE_ENV=production node scripts/cleanupOldEvents.js 30 180 >> logs/cleanup.log 2>&1

# DLQ Retry mais frequente (a cada 5 minutos)
*/5 * * * * cd /var/www/aureon-backend && NODE_ENV=production node scripts/runDLQRetry.js >> logs/dlq-retry.log 2>&1
```

### Desenvolvimento (baixo volume)
```bash
# Limpeza semanal
0 3 * * 0 cd /var/www/aureon-backend && NODE_ENV=production node scripts/cleanupOldEvents.js 365 730 >> logs/cleanup.log 2>&1

# DLQ Retry a cada hora
0 * * * * cd /var/www/aureon-backend && NODE_ENV=production node scripts/runDLQRetry.js >> logs/dlq-retry.log 2>&1
```

---

## 🎯 Próximos Passos

- [ ] Configurar monitoramento com Prometheus/Grafana
- [ ] Implementar alertas via Slack/Discord
- [ ] Criar dashboard de visualização de DLQ
- [ ] Adicionar métricas de performance
- [ ] Implementar circuit breaker para eventos críticos
